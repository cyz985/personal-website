import { useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import type { Milestone, Project, TimeGroup } from '../config'
import { groupColorOf } from '../config'
import { CANVAS_SIZE, computeSpiralLayout } from '../lib/spiral'

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
  const layout = useMemo(() => computeSpiralLayout(projects, milestones, {}, groups), [projects, milestones, groups])

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
    <div className="spiral-canvas relative mx-auto aspect-square">
      <svg
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        role="list"
        aria-label="项目成长时间轴"
      >
        <defs>
          {/* 轨道由内到外：暖橙 → 淡紫 → 极光浅蓝 */}
          <radialGradient
            id="track-gradient"
            gradientUnits="userSpaceOnUse"
            cx={layout.center}
            cy={layout.center}
            r={CANVAS_SIZE / 2}
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
          strokeWidth={22}
          strokeOpacity={0.07}
          strokeLinecap="round"
        />
        <path
          d={layout.trackPath}
          fill="none"
          stroke="url(#track-gradient)"
          strokeWidth={8}
          strokeOpacity={0.16}
          strokeLinecap="round"
        />
        <path
          d={layout.trackPath}
          fill="none"
          stroke="url(#track-gradient)"
          strokeWidth={2.2}
          strokeOpacity={0.92}
          strokeLinecap="round"
        />

        {/* 里程碑：轨道上的小圆点 + 一根很淡的引导线 + 轨道外侧的时间文字 */}
        {layout.milestones.map((milestone) => (
          <g key={milestone.id} className="milestone">
            <line
              x1={milestone.x}
              y1={milestone.y}
              x2={milestone.leaderX}
              y2={milestone.leaderY}
              stroke="#8FA3C4"
              strokeOpacity={0.2}
              strokeWidth={1}
              strokeLinecap="round"
            />
            <circle
              cx={milestone.x}
              cy={milestone.y}
              r={6.5}
              fill="#F5F1E8"
              fillOpacity={0.06}
              stroke="#FFB370"
              strokeOpacity={0.3}
              strokeWidth={1}
            />
            <circle cx={milestone.x} cy={milestone.y} r={2.6} fill="#F5F1E8" fillOpacity={0.72} />
            <text
              x={milestone.labelX}
              y={milestone.labelY}
              textAnchor={milestone.anchor}
              fontSize={14.5}
              fontWeight={600}
              letterSpacing={0.6}
              fill="#FFD0A6"
              fillOpacity={0.96}
              paintOrder="stroke"
              stroke="#1B2A4A"
              strokeOpacity={0.85}
              strokeWidth={3}
            >
              {milestone.time}
            </text>
            <text
              x={milestone.labelX}
              y={milestone.labelY2}
              textAnchor={milestone.anchor}
              fontSize={15.5}
              fontWeight={600}
              letterSpacing={0.4}
              fill="#C3CFE4"
              fillOpacity={0.94}
              paintOrder="stroke"
              stroke="#1B2A4A"
              strokeOpacity={0.85}
              strokeWidth={3.2}
            >
              {milestone.label}
            </text>
          </g>
        ))}

        {/* 项目节点：星球式卡片 */}
        {layout.nodes.map((node) => {
          // 如果星球绑定了分组，用分组色覆盖圈层色（让同组星球光晕色调统一）
          const boundGroup = groups.find((g) => g.id === node.project.groupId)
          const override = groupColorOf(boundGroup, groups)
          const zone = zoneOf(node.progress)
          const accent = override?.accent ?? zone.accent
          const glow = override?.glow ?? zone.glow
          const r = node.nodeRadius
          const lines = nameLines(node.project.name)
          // 名称字号同时受星球半径与最长一行的字数约束，避免文字顶出球体
          const longest = Math.max(...lines.map((line) => Array.from(line).length))
          const nameFont = Math.min(27, Math.max(13, Math.min(r * 0.34, (r * 1.6) / longest)))
          const subFont = nameFont * 0.86
          const timeFont = Math.min(14, Math.max(9.5, r * 0.155))
          const tagFont = Math.min(12, Math.max(8, r * 0.135))
          const tagWidth = node.project.tag.length * tagFont * 1.06 + 12
          const tagHeight = tagFont * 1.9
          const ringWidth = 1.4 + 1.1 * node.progress
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
              onClick={() => onOpenProject(node.project)}
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
                {/* 外圈柔光 */}
                <circle
                  className="node-halo"
                  cx={node.x}
                  cy={node.y}
                  r={r + 15}
                  fill="url(#planet-glow)"
                  fillOpacity={0.1}
                  stroke={accent}
                  strokeOpacity={0.1}
                  strokeWidth={1.2}
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
                  strokeWidth={1.6}
                  strokeLinecap="round"
                />
                <circle
                  cx={node.x - r * 0.5}
                  cy={node.y - r * 0.52}
                  r={Math.max(1.4, r * 0.05)}
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
                  strokeWidth={0.9}
                />
                <text
                  x={node.x}
                  y={node.y - r * 0.6 + tagFont * 0.36}
                  textAnchor="middle"
                  fontSize={tagFont}
                  letterSpacing={0.5}
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
                    letterSpacing={0.3}
                    fill={node.project.nameColor ?? '#F5F1E8'}
                    fillOpacity={0.92}
                    paintOrder="stroke"
                    stroke="#1B2A4A"
                    strokeOpacity={0.7}
                    strokeWidth={2}
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
                  letterSpacing={1.2}
                  fill="#C9D5EA"
                  fillOpacity={0.85}
                >
                  {node.project.time}
                </text>
              </g>
            </g>
          )
        })}

        {/* 轨道末端：呼吸光点 + 未完待续 */}
        <g>
          <circle cx={layout.tail.x} cy={layout.tail.y} r={16} fill="#FFB370" fillOpacity={0.1} />
          <circle cx={layout.tail.x} cy={layout.tail.y} r={9} fill="#FFB370" fillOpacity={0.18} />
          <circle
            className="breath-dot"
            cx={layout.tail.x}
            cy={layout.tail.y}
            r={5}
            fill="#FFC79B"
            fillOpacity={0.95}
          />
          <text
            x={layout.tail.textX}
            y={layout.tail.textY}
            textAnchor="middle"
            fontSize={24}
            letterSpacing={1.2}
            fill="#F5F1E8"
            fillOpacity={0.9}
            paintOrder="stroke"
            stroke="#1B2A4A"
            strokeOpacity={0.85}
            strokeWidth={3}
          >
            {note}
          </text>
        </g>
      </svg>

      {/* 右键删除确认浮层 */}
      {pendingDelete && (
        <div
          className="absolute z-30 min-w-[240px] max-w-[300px] rounded-xl border border-ember/40 bg-ink/95 px-4 py-3 text-paper shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(pendingDelete.x, 1000 - 300), // 避免贴右边缘
            top: Math.min(pendingDelete.y, 1000 - 140), // 避免贴下边缘
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
