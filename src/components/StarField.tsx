import { useEffect, useMemo, useRef, useState } from 'react'

/** 星星造型：圆点、十字星、四角星芒 */
type StarKind = 'dot' | 'cross' | 'star'
/** 闪烁节奏：高频微闪 / 低频呼吸 / 常亮 */
type Twinkle = 'none' | 'breath' | 'flicker'

interface Star {
  x: number
  y: number
  r: number
  color: string
  opacity: number
  kind: StarKind
  twinkle: Twinkle
  /** 闪烁周期（秒）与相位偏移（秒），逐颗错开，绝不整齐划一 */
  duration: number
  delay: number
  /** 闪烁最低亮度比例（30%~45%），形成明显的明暗层次 */
  floor: number
  /** 漂移分组：三组方向 / 速度不同，叠加整层漂移形成自然波动感 */
  floatGroup: 0 | 1 | 2
}

/** 遮挡禁区（画布 viewBox 坐标） */
interface Zone {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** 轨道线上的采样点（星星也要避让轨道线） */
interface TrackPoint {
  x: number
  y: number
}

interface SafeArea {
  zones: Zone[]
  points: TrackPoint[]
  /** 轨道线避让半径（viewBox 单位） */
  lineRadius: number
}

/**
 * 星星生成：固定种子伪随机，位置每次刷新完全一致
 * 分布策略：60% 落在宽屏必然可见的横向带（y 170~830），40% 均匀铺满整块画布；
 * 具体的"不压星球 / 不压文字 / 不压轨道线"由运行时测量禁区后过滤，做到精确避让。
 */
const STARS: Star[] = (() => {
  let seed = 20260101
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }

  const COLORS = ['#F2F7FF', '#F2F7FF', '#E4EFFF', '#DCEBFF', '#C7A6FF', '#FFD98E']
  const TOTAL = 215
  const list: Star[] = []

  for (let i = 0; i < TOTAL; i++) {
    const inBand = rand() < 0.62
    const x = rand() * 1000
    // 宽屏（slice 裁切）下必然可见的横向带，确保加进来的星星真的能被看到
    const y = inBand ? 230 + rand() * 540 : rand() * 1000

    const roll = rand()
    let kind: StarKind = 'dot'
    let r = 0.8 + rand() * 0.6
    let opacity = 0.34 + rand() * 0.24
    let color = COLORS[Math.floor(rand() * COLORS.length)]

    if (roll < 0.16) {
      // 十字星
      kind = 'cross'
      r = 1.2 + rand() * 0.7
      opacity = 0.4 + rand() * 0.22
      color = rand() < 0.35 ? '#C7A6FF' : '#F2F7FF'
    } else if (roll < 0.3) {
      // 四角星芒
      kind = 'star'
      r = 1.2 + rand() * 0.8
      opacity = 0.38 + rand() * 0.22
      color = rand() < 0.4 ? '#DCEBFF' : '#F2F7FF'
    } else if (roll < 0.94) {
      // 水晶光点：主体密度，外圈淡光 + 内芯高亮
      r = 1.9 + rand() * 0.8
      opacity = 0.46 + rand() * 0.2
    } else {
      // 极少量明亮锚点
      r = 2.5 + rand() * 0.7
      opacity = 0.62 + rand() * 0.16
      color = rand() < 0.5 ? '#FFD98E' : '#FFFFFF'
    }

    // 闪烁节奏分层：高频微闪 / 低频呼吸 / 常亮
    const tw = rand()
    const twinkle: Twinkle = tw < 0.38 ? 'flicker' : tw < 0.84 ? 'breath' : 'none'
    // 小星闪得更快，大星更慢，视觉层次更自然
    const duration =
      twinkle === 'flicker'
        ? 1.7 + rand() * 2.1
        : 6.5 + rand() * 8.5 + (1 - r / 2.2) * 0

    list.push({
      x,
      y,
      r,
      color,
      opacity,
      kind,
      twinkle,
      duration,
      delay: rand() * 14,
      floor: 0.3 + rand() * 0.15,
      floatGroup: (i % 3) as 0 | 1 | 2,
    })
  }

  return list
})()

/**
 * 背景星尘层：圆点 / 十字星 / 四角星芒，始终处于最底层
 * - 运行时测量星球节点、轨道时间标签、中心圆盘、轨道末端文字的实际位置，
 *   以及轨道主线的采样点，生成遮挡禁区，星星自动避开（文字四周留 20 单位安全区，
 *   大于约 20px 的屏幕距离，同时覆盖 ±12px 的缓慢漂移幅度）
 * - 大量星星以 30%~100% 亮度变化闪烁：一部分高频微闪、一部分低频呼吸，相位全错开
 * - 只有透明度变化，不做位移 / 缩放跳动
 * pointer-events-none，完全不影响点击与阅读
 */
export default function StarField() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [safe, setSafe] = useState<SafeArea>({ zones: [], points: [], lineRadius: 7 })

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    let raf = 0
    const measure = () => {
      const ctm = svg.getScreenCTM()
      if (!ctm) return
      const inv = ctm.inverse()
      const scale = Math.hypot(ctm.a, ctm.b) || 1
      // 文字 / 星球四周的安全区：20 个 viewBox 单位（≥20px 屏幕距离，且覆盖漂移幅度）
      const margin = 20

      const zones: Zone[] = []
      document
        .querySelectorAll('.spiral-node, .milestone, .core-name, .core-hint, .spiral-tail')
        .forEach((el) => {
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 && rect.height === 0) return
          const pts = [
            new DOMPoint(rect.left, rect.top),
            new DOMPoint(rect.right, rect.top),
            new DOMPoint(rect.left, rect.bottom),
            new DOMPoint(rect.right, rect.bottom),
          ].map((p) => p.matrixTransform(inv))
          const xs = pts.map((p) => p.x)
          const ys = pts.map((p) => p.y)
          zones.push({
            x0: Math.min(...xs) - margin,
            x1: Math.max(...xs) + margin,
            y0: Math.min(...ys) - margin,
            y1: Math.max(...ys) + margin,
          })
        })

      // 轨道主线：逐段采样，星星不压线
      const points: TrackPoint[] = []
      document.querySelectorAll<SVGPathElement>('.spiral-track').forEach((path) => {
        const ownerMatrix = path.ownerSVGElement?.getScreenCTM()
        if (!ownerMatrix) return
        let len = 0
        try {
          len = path.getTotalLength()
        } catch {
          return
        }
        if (!len) return
        const step = Math.max(14, len / 26)
        for (let d = 0; d <= len; d += step) {
          const pt = path.getPointAtLength(d)
          const v = new DOMPoint(pt.x, pt.y).matrixTransform(ownerMatrix).matrixTransform(inv)
          points.push({ x: v.x, y: v.y })
        }
      })

      setSafe({ zones, points, lineRadius: 7 / scale })
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    // 首次渲染、布局稳定后各测一次，之后随窗口尺寸变化重测
    schedule()
    const t1 = window.setTimeout(measure, 300)
    const t2 = window.setTimeout(measure, 1200)
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  /** 过滤掉落在禁区内的星星 */
  const visible = useMemo(() => {
    const { zones, points, lineRadius } = safe
    if (!zones.length && !points.length) return STARS
    const r2 = lineRadius * lineRadius
    return STARS.filter((star) => {
      for (const z of zones) {
        if (star.x > z.x0 && star.x < z.x1 && star.y > z.y0 && star.y < z.y1) return false
      }
      for (const p of points) {
        const dx = star.x - p.x
        const dy = star.y - p.y
        if (dx * dx + dy * dy < r2) return false
      }
      return true
    })
  }, [safe])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* 整层星尘极缓慢漂移 */}
      <g className="star-drift">
        {[0, 1, 2].map((group) => (
          <g key={group} className={`star-float star-float-${'abc'[group]}`}>
            {visible
              .filter((star) => star.floatGroup === group)
              .map((star, index) => {
                const cx = star.x
                const cy = star.y
                const twinkleClass =
                  star.twinkle === 'flicker'
                    ? 'star-flicker'
                    : star.twinkle === 'breath'
                      ? 'star-twinkle'
                      : undefined
                return (
                  <g
                    key={index}
                    opacity={star.opacity}
                    className={twinkleClass}
                    style={
                      star.twinkle !== 'none'
                        ? {
                            ['--tw-min' as string]: star.opacity * star.floor,
                            ['--tw-max' as string]: star.opacity,
                            ['--tw-dur' as string]: `${star.duration.toFixed(2)}s`,
                            animationDelay: `${star.delay.toFixed(2)}s`,
                          }
                        : undefined
                    }
                  >
                    {star.kind === 'cross' ? (
                      <>
                        <circle cx={cx} cy={cy} r={star.r * 0.55} fill={star.color} />
                        <line
                          x1={cx - star.r * 3}
                          y1={cy}
                          x2={cx + star.r * 3}
                          y2={cy}
                          stroke={star.color}
                          strokeWidth={0.7}
                          strokeOpacity={0.5}
                        />
                        <line
                          x1={cx}
                          y1={cy - star.r * 3}
                          x2={cx}
                          y2={cy + star.r * 3}
                          stroke={star.color}
                          strokeWidth={0.7}
                          strokeOpacity={0.5}
                        />
                      </>
                    ) : star.kind === 'star' ? (
                      <path
                        d={`M ${cx} ${cy - star.r * 2.2} Q ${cx + star.r * 0.32} ${
                          cy - star.r * 0.32
                        } ${cx + star.r * 2.2} ${cy} Q ${cx + star.r * 0.32} ${
                          cy + star.r * 0.32
                        } ${cx} ${cy + star.r * 2.2} Q ${cx - star.r * 0.32} ${
                          cy + star.r * 0.32
                        } ${cx - star.r * 2.2} ${cy} Q ${cx - star.r * 0.32} ${
                          cy - star.r * 0.32
                        } ${cx} ${cy - star.r * 2.2} Z`}
                        fill={star.color}
                      />
                    ) : (
                      <>
                        {/* 水晶光点：淡色外晕 + 高亮内芯，比纯白圆点更透亮 */}
                        <circle cx={cx} cy={cy} r={star.r} fill={star.color} fillOpacity={0.32} />
                        <circle cx={cx} cy={cy} r={star.r * 0.38} fill="#FFFFFF" fillOpacity={0.9} />
                      </>
                    )}
                  </g>
                )
              })}
          </g>
        ))}
      </g>
    </svg>
  )
}
