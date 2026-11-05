/* =============================================================================
 * spiral.ts —— 成长时间轴轨道布局（纯函数，与 React 无关）
 * -----------------------------------------------------------------------------
 * 公式：r(θ) = r0 + b · θ，其中 b = pitchPerTurn / 2π
 *
 * 布局思路：
 *   1. 项目按 config.ts 数组顺序（＝成长时间顺序）沿螺旋由内向外依次摆放
 *   2. 相邻节点保持最小弧长间距 Δθ = minArcGap / r_prev，节点数任意都不会重叠
 *   3. 节点半径从内圈到外圈线性增大，越晚的项目越大
 *   4. 全部节点按比例缩放，保证最外侧节点的圆环刚好贴近画布边缘
 *      （节点内部自带文字，所以不需要额外预留文字高度）
 *   5. 里程碑（时间小圆点 + 时间文字）落在两个项目节点之间的轨道上，
 *      文字沿半径方向向轨道外侧偏移，避免压住项目节点
 *   6. 轨道继续向外延伸到画布边缘，末端是呼吸光点 + "未完待续"
 *
 * 想调节视觉效果，只需要修改 defaultSpiralOptions。
 * ============================================================================= */

import type { Milestone, Project, TimeGroup } from '../config'

/** 螺旋布局参数 */
export interface SpiralOptions {
  /** 内圈第一颗节点所在半径（逻辑单位） */
  startRadius: number
  /** 每整圈半径增量（螺距） */
  pitchPerTurn: number
  /** 相邻节点的最小弧长间距 */
  minArcGap: number
  /** 最内圈节点半径 */
  nodeRadiusMin: number
  /** 最外圈节点半径 */
  nodeRadiusMax: number
  /** 节点圆环距离画布边缘的留白 */
  edgePadding: number
  /** 末端呼吸光点所在方向（度，90 = 正下方） */
  tailDirection: number
  /** 轨道在光点之后继续向画布外延伸的距离（逻辑单位） */
  tailOverflow: number
  /** 实际画布宽度（像素/相对单位）。不传时退回正方形 CANVAS_SIZE */
  canvasWidth?: number
  /** 实际画布高度（像素/相对单位）。不传时退回正方形 CANVAS_SIZE */
  canvasHeight?: number
  /** 轨道外缘到画布边缘的安全留白比例（8%~12%，默认 0.09） */
  safePaddingRatio?: number
}

/** 默认参数：螺旋轨道向外舒展，节点沿螺旋自然铺开，不扎堆一侧 */
export const defaultSpiralOptions: SpiralOptions = {
  startRadius: 200, // 内圈第一颗星球离中心圆的距离（逻辑单位）
  pitchPerTurn: 185, // 每圈外扩的距离，圈与圈之间留白舒服
  minArcGap: 440, // 相邻节点的弧长间距，9 个节点绕约 1.7 圈
  nodeRadiusMin: 60, // 内圈星球基准尺寸
  nodeRadiusMax: 108, // 外圈重点项目比内圈大
  edgePadding: 16, // 最外圈节点几乎贴到画布边缘
  tailDirection: 92, // 螺旋末端（未完待续光点）朝向，基本正下方
  tailOverflow: 24,
}

/** 画布逻辑边长（SVG viewBox 固定为 1000×1000，实际显示尺寸由 CSS 控制） */
export const CANVAS_SIZE = 1000

const HALF = CANVAS_SIZE / 2
const DEG = Math.PI / 180

/** 计算后的单个节点（坐标均为画布逻辑坐标） */
export interface SpiralNode {
  project: Project
  x: number
  y: number
  /** 节点圆半径 */
  nodeRadius: number
  /** 节点到画布中心的距离 */
  polarRadius: number
  /** 节点所在方向（度） */
  angleDeg: number
  /** 节点在成长进度中的比例 0~1（用于选色与字号） */
  progress: number
}

/** 轨道上的时间里程碑 */
export interface SpiralMilestone {
  id: string
  time: string
  label: string
  /** 轨道上的小圆点 */
  x: number
  y: number
  /** 第一行（时间）文字的坐标 */
  labelX: number
  labelY: number
  /** 第二行（说明）文字的 y 坐标 */
  labelY2: number
  anchor: 'start' | 'middle' | 'end'
  /** 文字锚点：从小圆点引出的一根很淡的引导线终点 */
  leaderX: number
  leaderY: number
}

/** 螺旋末端的呼吸光点与文字位置 */
export interface SpiralTail {
  x: number
  y: number
  textX: number
  textY: number
}

/** 布局结果 */
export interface SpiralLayout {
  /** 画布实际宽度 */
  width: number
  /** 画布实际高度 */
  height: number
  /** 画布中心 X（中心圆始终落在这里） */
  centerX: number
  /** 画布中心 Y */
  centerY: number
  /**
   * 统一缩放系数：节点半径 / 字号 / 线宽都用它换算，
   * 保证星球永远是正圆、文字比例一致，不会被椭圆映射拉扁
   */
  unitScale: number
  nodes: SpiralNode[]
  milestones: SpiralMilestone[]
  /** 轨道 SVG path（从内圈起点一直画到画布外） */
  trackPath: string
  tail: SpiralTail
}

/**
 * 采样螺旋轨道，输出 SVG path 的 d 属性
 * @param thetaFrom 起始角度（相对螺旋起点的弧度增量）
 * @param thetaTo 结束角度
 */
function sampleTrack(
  thetaFrom: number,
  thetaTo: number,
  center: number,
  radius0: number,
  spiralB: number,
  startAngleRad: number,
  /** 坐标映射：把逻辑正方形坐标映射到实际画布（用于椭圆拉伸） */
  map?: (x: number, y: number) => [number, number],
): string {
  const span = Math.max(thetaTo - thetaFrom, 0.1)
  // 0.06 弧度一个采样点：一条轨道约 300 个点，静态路径，渲染开销极小
  const steps = Math.max(16, Math.ceil(span / 0.06))
  const points: string[] = []

  for (let i = 0; i <= steps; i++) {
    const theta = thetaFrom + (span * i) / steps
    const radius = radius0 + spiralB * theta
    const angle = startAngleRad + theta
    const x = center + radius * Math.cos(angle)
    const y = center + radius * Math.sin(angle)
    const [px, py] = map ? map(x, y) : [x, y]
    points.push(`${px.toFixed(1)} ${py.toFixed(1)}`)
  }

  return `M ${points.join(' L ')}`
}

/**
 * 计算成长时间轴：节点坐标 + 里程碑 + 轨道路径 + 末端光点
 *
 * 自动适配任意数量的项目与里程碑，无需改这里。
 */
export function computeSpiralLayout(
  projects: Project[],
  milestones: Milestone[] = [],
  options: Partial<SpiralOptions> = {},
  /** 可选：自动根据 projects 的 groupId 变化生成分组时间节点 */
  groups: TimeGroup[] = [],
): SpiralLayout {
  const opts: SpiralOptions = { ...defaultSpiralOptions, ...options }
  const spiralB = opts.pitchPerTurn / (2 * Math.PI)

  // ---- 1. 沿螺旋依次摆放节点（相对圆心的极坐标） ----
  interface Placed {
    project: Project
    theta: number
    radius: number
    nodeRadius: number
    progress: number
  }

  const placed: Placed[] = []
  let theta = 0

  projects.forEach((project, index) => {
    if (index > 0) {
      // 按上一节点的半径换算角度步长，保证最小弧长间距
      theta += opts.minArcGap / Math.max(placed[index - 1].radius, opts.startRadius)
    }
    const radius = opts.startRadius + spiralB * theta
    const progress = projects.length <= 1 ? 1 : index / (projects.length - 1)
    const baseRadius =
      opts.nodeRadiusMin + (opts.nodeRadiusMax - opts.nodeRadiusMin) * progress
    // 自定义尺寸：用户在编辑面板里设置的百分比，限制在 50~200；留空或 100 都用默认
    const pct = project.sizePercent
    const nodeRadius =
      pct != null && pct !== 100
        ? baseRadius * (Math.max(50, Math.min(200, pct)) / 100)
        : baseRadius

    placed.push({ project, theta, radius, nodeRadius, progress })
  })

  // ---- 1.5 自动生成分组时间节点："进入新分组"的那个项目之前的轨道空隙 ----
  // 规则：projects[i].groupId 有值 且 (i===0 或 groupId !== 上一个) → 在 gap i-1 放节点
  interface GapMilestone {
    id: string
    time: string
    label: string
    gapIndex: number
  }

  const autoGroupNodes: GapMilestone[] = []
  if (groups.length > 0 && projects.length >= 2) {
    for (let i = 0; i < projects.length; i++) {
      const gid = projects[i].groupId
      if (!gid) continue
      const isNewGroup = i === 0 || gid !== projects[i - 1].groupId
      if (!isNewGroup) continue
      const group = groups.find((g) => g.id === gid)
      if (!group) continue
      // i=0 没有前一个项目 → 放到 gap 0（placed[0] 和 placed[1] 之间）
      const gapIndex = i === 0 ? 0 : Math.min(i - 1, placed.length - 2)
      autoGroupNodes.push({
        id: `group-${group.id}-gap-${gapIndex}`,
        time: group.time || '',
        label: group.label || group.id,
        gapIndex,
      })
    }
  }

  // ---- 2. 计算缩放比例：最外侧节点的圆环刚好贴近画布边缘 ----
  let extent = 0
  placed.forEach((item) => {
    extent = Math.max(extent, item.radius + item.nodeRadius)
  })
  if (extent <= 0) extent = CANVAS_SIZE

  const scale = (HALF - opts.edgePadding) / extent
  const radius0 = opts.startRadius * scale
  const scaledB = spiralB * scale

  // ---- 3. 旋转整个螺旋：让末端呼吸光点落在指定方向，末端恰好位于画布边缘 ----
  const tailTheta = Math.max((HALF - radius0) / scaledB, 1)
  const startAngleRad = opts.tailDirection * DEG - tailTheta

  // ---- 4. 节点绝对坐标（先按逻辑正方形 CANVAS_SIZE 计算） ----
  const nodes: SpiralNode[] = placed.map((item) => {
    const angle = startAngleRad + item.theta
    const polarRadius = item.radius * scale
    const x = HALF + polarRadius * Math.cos(angle)
    const y = HALF + polarRadius * Math.sin(angle)

    return {
      project: item.project,
      x,
      y,
      nodeRadius: item.nodeRadius * scale,
      polarRadius,
      angleDeg: angle / DEG,
      progress: item.progress,
    }
  })

  // ---- 4.5 自适应映射：逻辑正方形 → 实际画布（宽屏拉成横向椭圆 / 窄屏纵向椭圆 / 方形保持圆形）
  const canvasW = Math.max(opts.canvasWidth ?? CANVAS_SIZE, 240)
  const canvasH = Math.max(opts.canvasHeight ?? CANVAS_SIZE, 240)
  // 安全留白比例限制在 4%~18%，默认 9%
  const safeRatio = Math.min(Math.max(opts.safePaddingRatio ?? 0.09, 0.04), 0.18)

  // 逻辑空间里节点外缘的最大占位（左右/上下分别计算，保证椭圆贴合画布）
  let extX = 1
  let extY = 1
  nodes.forEach((node) => {
    extX = Math.max(extX, Math.abs(node.x - HALF) + node.nodeRadius)
    extY = Math.max(extY, Math.abs(node.y - HALF) + node.nodeRadius)
  })

  // 可用半径：扣掉安全留白，确保最外侧星球不会被裁切
  const availX = Math.max(canvasW / 2 - canvasW * safeRatio, 40)
  const availY = Math.max(canvasH / 2 - canvasH * safeRatio, 40)
  const kx = availX / extX
  const ky = availY / extY
  // 节点半径 / 字号 / 线宽统一用一个系数，星球不会被拉成椭圆
  const unitScale = Math.min(kx, ky)

  const mapPoint = (x: number, y: number): [number, number] => [
    canvasW / 2 + (x - HALF) * kx,
    canvasH / 2 + (y - HALF) * ky,
  ]

  const mappedNodes: SpiralNode[] = nodes.map((node) => {
    const [x, y] = mapPoint(node.x, node.y)
    return { ...node, x, y, nodeRadius: node.nodeRadius * unitScale }
  })


  // ---- 5. 里程碑 + 自动分组节点：落在相邻节点的间隙里，并自动避让所有项目节点 ----
  const gapCount = placed.length - 1
  const spaced: SpiralMilestone[] = []

  /** 估算文字宽度：ASCII 按 0.6em，中日韩字符按 1em */
  const estimateWidth = (text: string, fontSize: number) => {
    let width = 0
    for (const char of text) width += /[ -~]/.test(char) ? fontSize * 0.6 : fontSize
    return width
  }

  const TIME_FONT = 14.5
  const LABEL_FONT = 15.5

  // 合并：预定义 milestones（均匀映射 gap）+ 自动分组节点（自带 gapIndex）
  interface UnifiedMs {
    id: string
    time: string
    label: string
    gapIndex: number
  }
  const predefinedWithGap: UnifiedMs[] = milestones.map((ms, m) => ({
    id: ms.id,
    time: ms.time,
    label: ms.label,
    gapIndex: Math.round((m * (gapCount - 1)) / Math.max(milestones.length - 1, 1)),
  }))
  const allMs: UnifiedMs[] = [...predefinedWithGap, ...autoGroupNodes]

  if (gapCount > 0 && allMs.length > 0) {
    allMs.forEach((um) => {
      // 复用原坐标计算逻辑：from 和 to 两个节点之间的轨道位置
      const gapIndex = Math.max(0, Math.min(um.gapIndex, gapCount - 1))
      const from = placed[Math.min(gapIndex, gapCount - 1)]
      const to = placed[Math.min(gapIndex + 1, gapCount)]
      const midTheta = (from.theta + to.theta) / 2
      const radius = radius0 + scaledB * midTheta
      const angle = startAngleRad + midTheta
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const dotX = HALF + radius * cos
      const dotY = HALF + radius * sin

      // 文字块尺寸（含少量描边留白）
      const boxWidth =
        Math.max(estimateWidth(um.time, TIME_FONT), estimateWidth(um.label, LABEL_FONT)) + 12
      const halfWidth = boxWidth / 2

      // 方向决定文字向哪一侧展开：右侧从锚点向右、左侧向左、上下居中
      const preferred: SpiralMilestone['anchor'] =
        cos > 0.4 ? 'start' : cos < -0.4 ? 'end' : 'middle'
      const anchors: SpiralMilestone['anchor'][] =
        preferred === 'middle' ? ['middle', 'start', 'end'] : [preferred, 'middle', preferred === 'start' ? 'end' : 'start']

      // 候选位置：先向轨道外侧找，再向轨道内侧找（避开相邻圈层的节点）
      const offsets: number[] = []
      for (let offset = 44; offset <= 300; offset += 6) offsets.push(offset)
      for (let offset = -44; offset >= -200; offset -= 6) offsets.push(offset)

      interface Candidate {
        anchor: SpiralMilestone['anchor']
        px: number
        py: number
        labelX: number
        labelY: number
        clearance: number
        inside: boolean
        freeOfLabels: boolean
        score: number
      }

      let chosen: Candidate | null = null
      let fallback: Candidate | null = null

      for (const offset of offsets) {
        const polar = radius + offset
        if (polar < 40) continue
        const px = HALF + polar * cos
        const py = HALF + polar * sin

        for (const anchor of anchors) {
          const labelX = anchor === 'start' ? px + 6 : anchor === 'end' ? px - 6 : px
          const labelY = py - 2
          // 文字块包围盒（第一行时间 + 第二行说明）
          const minX = anchor === 'start' ? labelX : anchor === 'end' ? labelX - boxWidth : labelX - halfWidth
          const maxX = minX + boxWidth
          const minY = py - 16
          const maxY = py + 20

          const inside =
            minX >= 6 && maxX <= CANVAS_SIZE - 6 && minY >= 6 && maxY <= CANVAS_SIZE - 6

          // 与所有项目节点的最小净空（含跨圈层的节点）
          let clearance = Infinity
          for (const node of nodes) {
            const dx = Math.max(node.x - maxX, minX - node.x, 0)
            const dy = Math.max(node.y - maxY, minY - node.y, 0)
            clearance = Math.min(clearance, Math.hypot(dx, dy) - node.nodeRadius)
          }
          // 也不能压住中心图案与提示文字
          const centerDx = Math.max(HALF - maxX, minX - HALF, 0)
          const centerDy = Math.max(HALF - maxY, minY - (HALF + 96), 0)
          clearance = Math.min(clearance, Math.hypot(centerDx, centerDy) - 54)

          // 与已放置的里程碑文字不互相压住
          let freeOfLabels = true
          for (const other of spaced) {
            const otherWidth =
              Math.max(estimateWidth(other.time, TIME_FONT), estimateWidth(other.label, LABEL_FONT)) + 12
            const otherMinX =
              other.anchor === 'start'
                ? other.labelX
                : other.anchor === 'end'
                  ? other.labelX - otherWidth
                  : other.labelX - otherWidth / 2
            const otherMaxX = otherMinX + otherWidth
            if (
              minX < otherMaxX + 8 &&
              maxX > otherMinX - 8 &&
              minY < other.labelY2 + 6 &&
              maxY > other.labelY - 16
            ) {
              freeOfLabels = false
              break
            }
          }

          const score = (inside ? 1000 : 0) + (freeOfLabels ? 400 : 0) + clearance
          const candidate: Candidate = { anchor, px, py, labelX, labelY, clearance, inside, freeOfLabels, score }

          if (inside && freeOfLabels && clearance >= 10) {
            chosen = candidate
            break
          }
          // 兜底：优先画布内、不与他人重叠，其次净空最大
          if (!fallback || score > fallback.score) fallback = candidate
        }

        if (chosen) break
      }

      const picked = chosen ?? fallback
      if (!picked) return

      spaced.push({
        id: um.id,
        time: um.time,
        label: um.label,
        x: dotX,
        y: dotY,
        labelX: picked.labelX,
        labelY: picked.labelY,
        labelY2: picked.labelY + 16,
        anchor: picked.anchor,
        leaderX: picked.px,
        leaderY: picked.py,
      })
    })
  }

  // ---- 6. 轨道：从起点一直画到画布边缘之外（路径同样做椭圆映射） ----
  const tailEndTheta = Math.max(
    tailTheta + 0.3,
    (HALF + opts.tailOverflow - radius0) / scaledB,
  )
  const trackPath = sampleTrack(
    0,
    tailEndTheta,
    HALF,
    radius0,
    scaledB,
    startAngleRad,
    mapPoint,
  )

  // ---- 7. 末端呼吸光点 + "未完待续" 文字（沿半径方向略微向外一点） ----
  const tailAngle = startAngleRad + tailTheta
  const tailX = HALF + HALF * Math.cos(tailAngle)
  const tailY = HALF + HALF * Math.sin(tailAngle)
  const textRadius = HALF + 34
  const [mappedTailX, mappedTailY] = mapPoint(tailX, tailY)
  const [mappedTextX, mappedTextY] = mapPoint(
    HALF + textRadius * Math.cos(tailAngle),
    HALF + textRadius * Math.sin(tailAngle),
  )
  const tail: SpiralTail = {
    x: mappedTailX,
    y: mappedTailY,
    textX: mappedTextX,
    textY: mappedTextY,
  }

  // 里程碑坐标同样映射到实际画布（行距用统一缩放系数，避免文字被拉伸）
  const mappedMilestones: SpiralMilestone[] = spaced.map((ms) => {
    const [x, y] = mapPoint(ms.x, ms.y)
    const [labelX, labelY] = mapPoint(ms.labelX, ms.labelY)
    const [leaderX, leaderY] = mapPoint(ms.leaderX, ms.leaderY)
    return { ...ms, x, y, labelX, labelY, labelY2: labelY + 16 * unitScale, leaderX, leaderY }
  })

  return {
    width: canvasW,
    height: canvasH,
    centerX: canvasW / 2,
    centerY: canvasH / 2,
    unitScale,
    nodes: mappedNodes,
    milestones: mappedMilestones,
    trackPath,
    tail,
  }
}
