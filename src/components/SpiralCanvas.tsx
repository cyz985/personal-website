import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Milestone, Project, TimeGroup } from '../config'
import { groupColorOf } from '../config'
import { CANVAS_SIZE, CENTER_LIFT_RATIO, computeSpiralLayout, defaultSpiralOptions } from '../lib/spiral'

interface SpiralCanvasProps {
  projects: Project[]
  /** 时间分组（逻辑标签，同组星球光晕色调统一） */
  groups: TimeGroup[]
  milestones: Milestone[]
  /** 点击节点：直接在新标签页打开项目在线地址 */
  onOpenProject: (project: Project) => void
  /** 右键星球节点：弹出自定义删除确认 */
  onRequestDelete?: (project: Project) => void
  /** 轨道末端的"未完待续"文案 */
  note: string
}

/** 三个圈层的主色：内圈暖橙 → 中圈淡紫 → 外圈极光浅蓝 */
const ZONES = [
  { accent: '#FFB370', glow: 'rgba(255, 179, 112, 0.34)' },
  { accent: '#C7A6FF', glow: 'rgba(199, 166, 255, 0.32)' },
  { accent: '#7FD8FF', glow: 'rgba(127, 216, 255, 0.32)' },
]

function zoneOf(progress: number) {
  if (progress < 0.34) return ZONES[0]
  if (progress < 0.68) return ZONES[1]
  return ZONES[2]
}

/** 名称断行：优先按 "·" 拆成品牌 + 类型两行，保持星球卡片内的文字排布 */
function nameLines(name: string): string[] {
  const parts = name
    .split('·')
    .map((item) => item.trim())
    .filter(Boolean)
  if (parts.length === 2) return parts
  if (name.length <= 9) return [name]
  const half = Math.ceil(name.length / 2)
  return [name.slice(0, half), name.slice(half)]
}

/**
 * 成长时间轴画布（宽屏展示，窄屏由 ProjectsSection 切换成 3 列网格）
 * - 所有坐标来自 computeSpiralLayout，本组件只负责渲染
 * - 轨道由三层叠加：外层柔光 + 中层光轨 + 内层主线
 * - 节点是星球式卡片：光环 + 球体 + 名称 / 时间 / 标签
 * - 没有任何自动旋转，只有 hover 时轻微上浮、放大与柔光
 */
export default function SpiralCanvas({
  projects,
  groups,
  milestones,
  onOpenProject,
  onRequestDelete,
  note,
}: SpiralCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  /** 画布实际可用尺寸：随窗口 resize 实时更新，轨道据此自适应 */
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setCanvasSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ---------------------------------------------------------------- 3D 视角
  /** 基础俯仰角：取自螺旋默认参数，上半圈远离镜头形成纵深 */
  const BASE_TILT = defaultSpiralOptions.tiltDeg ?? 22

  /**
   * 视角状态：直接参与几何投影计算，不通过 CSS transform 缩放位图，
   * 因此星球与文字在任何角度下都由浏览器按矢量重新绘制，永远清晰。
   */
  const viewRef = useRef({ yaw: 0, pitch: 0, zoom: 1, sway: 0 })
  const [view, setView] = useState({ yaw: 0, pitch: 0, zoom: 1, sway: 0 })
  const commitView = () => setView({ ...viewRef.current })

  const dragRef = useRef({ active: false, x: 0, y: 0 })
  /** 本次按下是否落在星球上（用于区分"点击跳转"与"拖拽"） */
  const pressRef = useRef({ x: 0, y: 0, onNode: false })
  const suppressClickRef = useRef(false)
  const frameRef = useRef(0)
  const [autoRotate, setAutoRotate] = useState(true)

  const layout = useMemo(() => {
    const width = canvasSize.width || CANVAS_SIZE
    const height = canvasSize.height || CANVAS_SIZE
    return computeSpiralLayout(
      projects,
      milestones,
      {
        canvasWidth: width,
        canvasHeight: height,
        // 整个螺旋系统（含中心圆）上移，底部轨道与文字不再被页面下缘裁切
        offsetY: -CENTER_LIFT_RATIO * height,
        tiltDeg: BASE_TILT + view.pitch,
        yawDeg: view.yaw + view.sway,
        zoom: view.zoom,
      },
      groups,
    )
  }, [projects, milestones, groups, canvasSize.width, canvasSize.height, view])

  /** 统一缩放系数：节点半径 / 字号 / 线宽都按它换算，保证不被椭圆拉伸变形 */
  const u = layout.unitScale

  /** 星球按透视深度排序：远处的先画（在下层），近处的后画（压在上面） */
  const orderedNodes = useMemo(
    () => [...layout.nodes].sort((a, b) => a.depth - b.depth),
    [layout.nodes],
  )

  // 极缓慢的整体自转：60 秒一个来回、幅度 ±4°。
  // 每 240ms 才重算一次几何，此时角度变化不到 0.04°，看不出跳动，但省下大量渲染开销。
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!autoRotate || reduce) {
      viewRef.current.sway = 0
      commitView()
      return
    }
    const t0 = performance.now()
    const id = window.setInterval(() => {
      viewRef.current.sway = Math.sin(((performance.now() - t0) / 60000) * Math.PI * 2) * 4
      commitView()
    }, 240)
    return () => window.clearInterval(id)
  }, [autoRotate])

  // 滚轮控制镜头远近：改变整体缩放比例（同样是几何计算，不放大位图）
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const next = viewRef.current.zoom * (event.deltaY > 0 ? 0.94 : 1.06)
      viewRef.current.zoom = Math.max(0.82, Math.min(1.12, next))
      commitView()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // 仅左键；带 data-no-drag 的控件（如 3D 开关）不参与拖拽
    if (event.button !== 0) return
    const target = event.target as Element
    if (target.closest('[data-no-drag]')) return

    // 记录按下位置：即使按在星球上，移动超过阈值也算拖拽，抬手不触发跳转
    pressRef.current = {
      x: event.clientX,
      y: event.clientY,
      onNode: !!target.closest('.spiral-node'),
    }
    suppressClickRef.current = false

    // 在星球节点上按下不启动旋转：只有空白星空区域拖动才旋转 3D 轨道
    if (pressRef.current.onNode) return

    dragRef.current = { active: true, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    // 从星球上按下：只判断是否发生了拖动，用于抑制误触跳转，不旋转视角
    if (pressRef.current.onNode && !dragRef.current.active) {
      if (
        Math.abs(event.clientX - pressRef.current.x) > 3 ||
        Math.abs(event.clientY - pressRef.current.y) > 3
      ) {
        suppressClickRef.current = true
      }
      return
    }

    const drag = dragRef.current
    if (!drag.active) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) suppressClickRef.current = true
    drag.x = event.clientX
    drag.y = event.clientY
    const v = viewRef.current
    // 左右拖拽绕竖轴转、上下拖拽绕横轴俯仰，角度做收敛限制
    v.yaw = Math.max(-38, Math.min(38, v.yaw + dx * 0.16))
    v.pitch = Math.max(-14, Math.min(16, v.pitch - dy * 0.12))
    // 用 rAF 合并同一帧内的多次移动，避免拖拽时过度重算
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0
        commitView()
      })
    }
  }

  const endDrag = () => {
    dragRef.current.active = false
  }

  /** 右键删除确认浮层的状态 */
  const [pendingDelete, setPendingDelete] = useState<{
    project: Project
    /** 浮层的屏幕坐标（相对画布容器） */
    x: number
    y: number
  } | null>(null)

  const handleNodeContextMenu = (
    event: ReactMouseEvent<SVGGElement>,
    project: Project,
  ) => {
    // 只在星球节点上触发自定义菜单，阻止浏览器原生右键菜单
    event.preventDefault()
    if (!onRequestDelete) return
    const rect = event.currentTarget.closest('.spiral-canvas')?.getBoundingClientRect()
    if (!rect) return
    setPendingDelete({
      project,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }

  const closeConfirm = () => setPendingDelete(null)

  const confirmDelete = () => {
    if (!pendingDelete) return
    onRequestDelete?.(pendingDelete.project)
    setPendingDelete(null)
  }

  /** 确认浮层按钮文案（独立文案，避免导入 config 里的 SiteLabels） */
  const DELETE_CONFIRM_TEXT = '确定删除这个项目？轨道会自动重排，不可撤销。'
  const DELETE_CONFIRM_BTN = '删除'
  const DELETE_CANCEL_BTN = '取消'

  return (
    <div
      ref={containerRef}
      className="spiral-canvas relative h-full w-full"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* 3D 投影已在几何层完成，这里不做任何 CSS 3D 变换，文字始终保持矢量清晰 */}
      <div className="absolute inset-0">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          role="list"
          aria-label="项目成长时间轴"
        >
        <defs>
          {/* 轨道由内到外：暖橙 → 淡紫 → 极光浅蓝 */}
          <radialGradient
            id="track-gradient"
            gradientUnits="userSpaceOnUse"
            cx={layout.centerX}
            cy={layout.centerY}
            r={Math.hypot(layout.width, layout.height) / 2}
          >
            <stop offset="0%" stopColor="#FFB370" stopOpacity="0.85" />
            <stop offset="30%" stopColor="#FFB370" stopOpacity="0.7" />
            <stop offset="56%" stopColor="#C7A6FF" stopOpacity="0.62" />
            <stop offset="78%" stopColor="#7FD8FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7FD8FF" stopOpacity="0.3" />
          </radialGradient>

          {/* 星球球体：左上受光，右下偏深 */}
          <radialGradient id="planet-body" cx="32%" cy="26%" r="82%">
            <stop offset="0%" stopColor="#33477A" />
            <stop offset="52%" stopColor="#25365E" />
            <stop offset="100%" stopColor="#1A2547" />
          </radialGradient>

          {/* 星球外侧的柔和光晕 */}
          <radialGradient id="planet-glow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#FFB370" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFB370" stopOpacity="0.16" />
          </radialGradient>
        </defs>

        {/* 轨道三层：外层柔光、中层光轨、内层主线 */}
        <path
          d={layout.trackPath}
          fill="none"
          stroke="url(#track-gradient)"
          strokeWidth={22 * u}
          strokeOpacity={0.045}
          strokeLinecap="round"
        />
        <path
          d={layout.trackPath}
          fill="none"
          stroke="url(#track-gradient)"
          strokeWidth={8 * u}
          strokeOpacity={0.1}
          strokeLinecap="round"
        />
        {/* 主线：按 3D 深度切片渲染。远处只轻微衰减线宽与亮度，
            并强制几何精度渲染，保证画面上方（远端）轨道线同样锐利清晰 */}
        {layout.trackSegments.map((segment, index) => (
          <path
            key={`track-${index}`}
            className="spiral-track"
            d={segment.d}
            fill="none"
            stroke="url(#track-gradient)"
            strokeWidth={2.2 * u * (0.82 + 0.18 * segment.depth)}
            strokeOpacity={0.58 + 0.42 * segment.depth}
            strokeLinecap="round"
            shapeRendering="geometricPrecision"
          />
        ))}

        {/* 里程碑：轨道上的小圆点 + 一根很淡的引导线 + 轨道外侧的时间文字 */}
        {layout.milestones.map((milestone) => (
          <g
            key={milestone.id}
            className="milestone"
            opacity={0.55 + 0.45 * milestone.depth}
          >
            <line
              x1={milestone.x}
              y1={milestone.y}
              x2={milestone.leaderX}
              y2={milestone.leaderY}
              stroke="#8FA3C4"
              strokeOpacity={0.2}
              strokeWidth={1 * u}
              strokeLinecap="round"
            />
            <circle
              cx={milestone.x}
              cy={milestone.y}
              r={6.5 * u}
              fill="#F5F1E8"
              fillOpacity={0.06}
              stroke="#FFB370"
              strokeOpacity={0.3}
              strokeWidth={1 * u}
            />
            <circle cx={milestone.x} cy={milestone.y} r={2.6 * u} fill="#F5F1E8" fillOpacity={0.72} />
            <text
              x={milestone.labelX}
              y={milestone.labelY}
              textAnchor={milestone.anchor}
              fontSize={14.5 * u}
              fontWeight={600}
              letterSpacing={0.6 * u}
              fill="#FFD0A6"
              fillOpacity={0.96}
              paintOrder="stroke"
              stroke="#1B2A4A"
              strokeOpacity={0.85}
              strokeWidth={3 * u}
            >
              {milestone.time}
            </text>
            <text
              x={milestone.labelX}
              y={milestone.labelY2}
              textAnchor={milestone.anchor}
              fontSize={15.5 * u}
              fontWeight={600}
              letterSpacing={0.4 * u}
              fill="#C3CFE4"
              fillOpacity={0.94}
              paintOrder="stroke"
              stroke="#1B2A4A"
              strokeOpacity={0.85}
              strokeWidth={3.2 * u}
            >
              {milestone.label}
            </text>
          </g>
        ))}

        {/* 项目节点：星球式卡片（按透视深度排序，远处的在下层） */}
        {orderedNodes.map((node) => {
          // 如果星球绑定了分组，用分组色覆盖圈层色（让同组星球光晕色调统一）
          const boundGroup = groups.find((g) => g.id === node.project.groupId)
          const override = groupColorOf(boundGroup, groups)
          const zone = zoneOf(node.progress)
          const accent = override?.accent ?? zone.accent
          const glow = override?.glow ?? zone.glow
          const r = node.nodeRadius
          // 远景只降低装饰层的不透明度（60%~100%），文字始终保持高对比
          const bgOpacity = 0.6 + 0.4 * node.depth
          const textOpacity = 0.92 + 0.08 * node.depth
          const lines = nameLines(node.project.name)
          // 名称字号同时受星球半径与最长一行的字数约束，避免文字顶出球体
          const longest = Math.max(...lines.map((line) => Array.from(line).length))
          const nameFont = Math.min(27 * u, Math.max(14 * u, Math.min(r * 0.34, (r * 1.6) / longest)))
          const subFont = nameFont * 0.86
          const timeFont = Math.min(14 * u, Math.max(9.5 * u, r * 0.155))
          const tagFont = Math.min(12 * u, Math.max(8 * u, r * 0.135))
          const tagWidth = node.project.tag.length * tagFont * 1.06 + 12 * u
          const tagHeight = tagFont * 1.9
          const ringWidth = (1.4 + 1.1 * node.progress) * u
          const nameY1 = lines.length > 1 ? node.y - r * 0.06 : node.y + nameFont * 0.34
          const nameY2 = nameY1 + nameFont * 1.06

          return (
            <g
              key={node.project.id}
              className="spiral-node"
              style={
                {
                  '--node-accent': accent,
                  '--node-glow': glow,
                } as CSSProperties
              }
              role="link"
              tabIndex={0}
              aria-label={`打开项目：${node.project.name}（${node.project.time}）`}
              onClick={(event) => {
                // 仅左键单击生效，右键 / 中键不触发跳转
                if (event.button !== 0) return
                // 拖拽视角时误触的点击不跳转
                if (suppressClickRef.current) {
                  suppressClickRef.current = false
                  return
                }
                onOpenProject(node.project)
              }}
              onContextMenu={(event) => handleNodeContextMenu(event, node.project)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpenProject(node.project)
                }
              }}
            >
              <title>{`${node.project.name} · ${node.project.time}\n${node.project.summary}`}</title>

              <g className="planet">
                {/* 装饰层（光晕 / 球体 / 圆环 / 标签底）：远景仅轻微淡出到 60%，不做任何模糊 */}
                <g opacity={bgOpacity}>
                {/* 外圈柔光 */}
                <circle
                  className="node-halo"
                  cx={node.x}
                  cy={node.y}
                  r={r + 15 * u}
                  fill="url(#planet-glow)"
                  fillOpacity={0.1}
                  stroke={accent}
                  strokeOpacity={0.1}
                  strokeWidth={1.2 * u}
                />

                {/* 球体 */}
                <circle cx={node.x} cy={node.y} r={r} fill="url(#planet-body)" fillOpacity={0.95} />
                <circle cx={node.x} cy={node.y} r={r} fill={accent} fillOpacity={0.1} />

                {/* 球体边缘亮起的主色圆环 */}
                <circle
                  className="node-ring"
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill="none"
                  stroke={accent}
                  strokeOpacity={0.45}
                  strokeWidth={ringWidth}
                />

                {/* 左上高光弧 + 小星点，做出星球的受光感 */}
                <path
                  className="planet-rim"
                  d={`M ${node.x - r * 0.78} ${node.y - r * 0.34} A ${r * 0.86} ${r * 0.86} 0 0 1 ${node.x - r * 0.34} ${node.y - r * 0.78}`}
                  fill="none"
                  stroke={accent}
                  strokeOpacity={0.42}
                  strokeWidth={1.6 * u}
                  strokeLinecap="round"
                />
                <circle
                  cx={node.x - r * 0.5}
                  cy={node.y - r * 0.52}
                  r={Math.max(1.4 * u, r * 0.05)}
                  fill="#F5F1E8"
                  fillOpacity={0.3}
                />

                {/* 简短标签（星球顶部的胶囊） */}
                <rect
                  x={node.x - tagWidth / 2}
                  y={node.y - r * 0.6 - tagHeight / 2}
                  width={tagWidth}
                  height={tagHeight}
                  rx={tagHeight / 2}
                  fill={accent}
                  fillOpacity={0.16}
                  stroke={accent}
                  strokeOpacity={0.3}
                  strokeWidth={0.9 * u}
                />
                </g>
                <text
                  x={node.x}
                  y={node.y - r * 0.6 + tagFont * 0.36}
                  textAnchor="middle"
                  fontSize={tagFont}
                  letterSpacing={0.5 * u}
                  opacity={textOpacity}
                  fill={accent}
                  fillOpacity={0.95}
                >
                  {node.project.tag}
                </text>

                {/* 项目名称 */}
                {lines.map((line, index) => (
                  <text
                    key={line}
                    className="node-label"
                    x={node.x}
                    y={index === 0 ? nameY1 : nameY2}
                    textAnchor="middle"
                    fontSize={index === 0 ? nameFont : subFont}
                    fontWeight={500}
                    letterSpacing={0.3 * u}
                    opacity={textOpacity}
                    fill={node.project.nameColor ?? '#F5F1E8'}
                    fillOpacity={0.92}
                    paintOrder="stroke"
                    stroke="#1B2A4A"
                    strokeOpacity={0.78}
                    strokeWidth={2.2 * u}
                  >
                    {line}
                  </text>
                ))}

                {/* 时间 */}
                <text
                  x={node.x}
                  y={node.y + r * 0.62}
                  textAnchor="middle"
                  fontSize={timeFont}
                  letterSpacing={1.2 * u}
                  opacity={textOpacity}
                  fill="#C9D5EA"
                  fillOpacity={0.85}
                  paintOrder="stroke"
                  stroke="#1B2A4A"
                  strokeOpacity={0.7}
                  strokeWidth={1.6 * u}
                >
                  {node.project.time}
                </text>
              </g>
            </g>
          )
        })}

        {/* 轨道末端：呼吸光点 + 未完待续 */}
        <g className="spiral-tail">
          <circle cx={layout.tail.x} cy={layout.tail.y} r={16 * u} fill="#FFB370" fillOpacity={0.1} />
          <circle cx={layout.tail.x} cy={layout.tail.y} r={9 * u} fill="#FFB370" fillOpacity={0.18} />
          <circle
            className="breath-dot"
            cx={layout.tail.x}
            cy={layout.tail.y}
            r={5 * u}
            fill="#FFC79B"
            fillOpacity={0.95}
          />
          <text
            x={layout.tail.textX}
            y={layout.tail.textY}
            textAnchor="middle"
            fontSize={24 * u}
            letterSpacing={1.2 * u}
            fill="#F5F1E8"
            fillOpacity={0.9}
            paintOrder="stroke"
            stroke="#1B2A4A"
            strokeOpacity={0.85}
            strokeWidth={3 * u}
          >
            {note}
          </text>
        </g>
      </svg>
      </div>

      {/* 3D 视角提示 / 自转开关（不干扰原有交互） */}
      <button
        type="button"
        data-no-drag
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setAutoRotate((value) => !value)}
        className="spiral-3d-toggle absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-ink/35 px-3 py-1 text-[11px] text-muted/80 backdrop-blur-sm transition-colors hover:border-aurora/40 hover:text-paper"
        title="拖拽旋转视角 · 滚轮缩放"
      >
        3D 视角 · {autoRotate ? '缓慢自转中' : '已停用'}
      </button>

      {/* 右键删除确认浮层 */}
      {pendingDelete && (
        <div
          data-no-drag
          className="absolute z-30 min-w-[240px] max-w-[300px] rounded-xl border border-ember/40 bg-ink/95 px-4 py-3 text-paper shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(pendingDelete.x, Math.max(layout.width - 160, 0)), // 避免贴右边缘
            top: Math.min(pendingDelete.y, Math.max(layout.height - 120, 0)), // 避免贴下边缘
            transform: 'translate(-50%, -100%)', // 悬浮在右键位置的上方
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2.5 text-[12px] leading-relaxed text-paper/90">
            {DELETE_CONFIRM_TEXT}
          </p>
          <p className="mb-3 text-[11px] text-muted/80 truncate">
            「{pendingDelete.project.name}」· {pendingDelete.project.time}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              className="rounded-md border border-white/10 px-3 py-1 text-[11px] text-muted transition-colors hover:text-paper"
            >
              {DELETE_CANCEL_BTN}
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-md border border-ember/60 bg-ember/10 px-3 py-1 text-[11px] text-ember transition-colors hover:bg-ember/20"
            >
              {DELETE_CONFIRM_BTN}
            </button>
          </div>
          {/* 小尖角 */}
          <span className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-ink/95" />
        </div>
      )}
    </div>
  )
}
