interface Star {
  x: number
  y: number
  r: number
  color: string
  opacity: number
  sparkle: boolean
  /** 是否参与柔和闪烁 */
  twinkle: boolean
  /** 闪烁周期（秒）与相位偏移（秒），错开避免整齐划一 */
  twinkleDuration: number
  twinkleDelay: number
  /** 漂移分组：三组方向 / 速度不同，叠加整层漂移形成自然波动感 */
  floatGroup: 0 | 1 | 2
}

/**
 * 固定种子的伪随机：星尘位置每次刷新都一致，服务端/客户端也不会抖动
 * 位置完全静态；闪烁与漂移均为 CSS 动画（transform/opacity，开销极低）
 */

/** 漂移分组数量 */
const FLOAT_GROUPS = 3

/**
 * 位置分布策略（硬性两区制）：
 * - 【核心主体区】= 以画面中心为圆心、半径 312 的圆（完整覆盖螺旋轨道圈及其外沿缓冲带），
 *   内部大幅清空，仅放 4 颗几乎不可见的极细小点（透明度 0.08~0.15）
 * - 【外围区】= 核心区之外的全部安全带：约 75% 星星优先撒进上下两段横向缓冲区
 *   （y 240~495 与 y 505~760，避开中间核心区的自然挖空），25% 均匀散布画布其余外围空隙
 * - 轨道圈附近一圈（半径 238~312）完全无星，确保不贴轨道、不贴星球与时间文字
 * - 全随机 + 圆形挖空，无直线、无圆环、无贴纸感
 */
const STARS: Star[] = (() => {
  let seed = 20260101
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }

  /** 核心主体区半径：覆盖螺旋轨道外缘（约 238）+ 74 缓冲，圈内基本无星 */
  const CORE_R = 312
  const inCore = (x: number, y: number, extra = 0) => Math.hypot(x - 500, y - 500) < CORE_R + extra

  // 上下两段缓冲区（y 轴避开核心区后，上半截和下半截各占 ~155px 高度）
  const CORNER_BOXES = [
    { x0: 0, x1: 1000, y0: 0, y1: 240 },
    { x0: 0, x1: 1000, y0: 760, y1: 1000 },
  ]

  const list: Star[] = []
  let floatIndex = 0
  const nextGroup = () => (floatIndex++ % FLOAT_GROUPS) as 0 | 1 | 2

  type Kind = 'tiny' | 'medium' | 'large' | 'gold' | 'sparkle'
  const makeStar = (kind: Kind, pos: { x: number; y: number }): Star => {
    switch (kind) {
      case 'tiny': {
        const lilac = rand() < 0.3
        return {
          ...pos,
          r: 0.7 + rand() * 0.4,
          color: lilac ? '#C7A6FF' : '#F5F1E8',
          opacity: 0.2 + rand() * 0.14,
          sparkle: false,
          twinkle: rand() < 0.5,
          twinkleDuration: 5 + rand() * 3,
          twinkleDelay: rand() * 12,
          floatGroup: nextGroup(),
        }
      }
      case 'medium': {
        const lilac = rand() < 0.3
        return {
          ...pos,
          r: 1.15 + rand() * 0.65,
          color: lilac ? '#C7A6FF' : '#F5F1E8',
          opacity: 0.32 + rand() * 0.2,
          sparkle: false,
          twinkle: true,
          twinkleDuration: 5 + rand() * 4,
          twinkleDelay: rand() * 12,
          floatGroup: nextGroup(),
        }
      }
      case 'large': {
        const blue = rand() < 0.4
        return {
          ...pos,
          r: 2.1 + rand() * 0.8,
          color: blue ? '#CFE4FF' : '#F5F1E8',
          opacity: 0.4 + rand() * 0.15,
          sparkle: false,
          twinkle: true,
          twinkleDuration: 6 + rand() * 3.5,
          twinkleDelay: rand() * 12,
          floatGroup: nextGroup(),
        }
      }
      case 'gold': {
        const tone = rand()
        return {
          ...pos,
          r: 1.6 + rand() * 0.8,
          color: tone < 0.34 ? '#FFD98E' : tone < 0.67 ? '#FFC95C' : '#FFE3A8',
          opacity: 0.5 + rand() * 0.16,
          sparkle: false,
          twinkle: true,
          twinkleDuration: 6.5 + rand() * 3.5,
          twinkleDelay: rand() * 12,
          floatGroup: nextGroup(),
        }
      }
      default:
        return {
          ...pos,
          r: 2 + rand() * 1.3,
          color: rand() < 0.35 ? '#C7A6FF' : '#F5F1E8',
          opacity: 0.36 + rand() * 0.22,
          sparkle: true,
          twinkle: true,
          twinkleDuration: 5.5 + rand() * 3.5,
          twinkleDelay: rand() * 12,
          floatGroup: nextGroup(),
        }
    }
  }

  // —— 单层分布：约 75% 优先撒进上下两段缓冲区，25% 均匀散布画布其余外围空隙 ——
  // 总量 110 颗；中星 24 / 微星 30 / 大星 24 / 暖金 16 / 十字星 16
  const mix: Kind[] = [
    'medium', 'medium', 'medium', 'medium', 'medium', 'medium', 'medium', 'medium',
    'medium', 'medium', 'medium', 'medium', 'medium', 'medium', 'medium', 'medium',
    'medium', 'medium', 'medium', 'medium', 'medium', 'medium', 'medium', 'medium',
    'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny',
    'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny',
    'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny',
    'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny', 'tiny',
    'tiny', 'tiny', 'tiny', 'tiny',
    'large', 'large', 'large', 'large', 'large', 'large', 'large', 'large',
    'large', 'large', 'large', 'large', 'large', 'large', 'large', 'large',
    'large', 'large', 'large', 'large', 'large', 'large', 'large', 'large',
    'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold',
    'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold',
    'sparkle', 'sparkle', 'sparkle', 'sparkle', 'sparkle', 'sparkle', 'sparkle', 'sparkle',
    'sparkle', 'sparkle', 'sparkle', 'sparkle', 'sparkle', 'sparkle', 'sparkle', 'sparkle',
  ]

  let guard = 0
  let placed = 0
  while (placed < mix.length && guard++ < 4000) {
    let x: number
    let y: number
    // 75% 概率落进 CORNER_BOXES 区域
    if (rand() < 0.75) {
      const box = CORNER_BOXES[Math.floor(rand() * CORNER_BOXES.length)]
      x = box.x0 + rand() * (box.x1 - box.x0)
      y = box.y0 + rand() * (box.y1 - box.y0)
    } else {
      x = rand() * 1000
      y = rand() * 1000
    }
    if (inCore(x, y)) continue
    list.push(makeStar(mix[placed], { x: x / 10, y: y / 10 }))
    placed += 1
  }

  // —— 核心主体区：零星 4 颗极细小点，几乎不显眼，且都在轨道外沿之外 ——
  guard = 0
  placed = 0
  while (placed < 4 && guard++ < 400) {
    const x = 10 + rand() * 980
    const y = 240 + rand() * 520
    const d = Math.hypot(x - 500, y - 500)
    if (d < 300 || d > 345) continue
    list.push({
      x: x / 10,
      y: y / 10,
      r: 0.5 + rand() * 0.3,
      color: rand() < 0.5 ? '#C7A6FF' : '#F5F1E8',
      opacity: 0.08 + rand() * 0.07,
      sparkle: false,
      twinkle: false,
      twinkleDuration: 6,
      twinkleDelay: 0,
      floatGroup: nextGroup(),
    })
    placed += 1
  }

  return list
})()

/**
 * 背景星尘层：四角加权分布的淡白 / 浅紫 / 暖黄光点 + 四角星，始终处于最底层
 * - 整层缓慢漂移 + 三组子层各以不同方向 / 速度微漂（差异速度形成自然波动感）
 * - 大量星星以柔和幅度呼吸闪烁（相位 0~12s 全错开）
 * pointer-events-none，完全不影响点击与阅读
 */
export default function StarField() {
  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* 整层星尘极缓慢漂移 */}
      <g className="star-drift">
        {[0, 1, 2].map((group) => (
          <g key={group} className={`star-float star-float-${'abc'[group]}`}>
            {STARS.filter((star) => star.floatGroup === group).map((star, index) => {
              const cx = star.x * 10
              const cy = star.y * 10
              return (
                <g
                  key={index}
                  opacity={star.opacity}
                  className={star.twinkle ? 'star-twinkle' : undefined}
                  style={
                    star.twinkle
                      ? {
                          // 黄色亮星闪烁幅度稍大（45%↔105%），普通星更轻（62%↔100%）
                          ['--tw-min' as string]:
                            star.color.startsWith('#FF') ? star.opacity * 0.45 : star.opacity * 0.62,
                          ['--tw-max' as string]: star.opacity,
                          animationDuration: `${star.twinkleDuration}s`,
                          animationDelay: `${star.twinkleDelay.toFixed(2)}s`,
                        }
                      : undefined
                  }
                >
                  {star.sparkle ? (
                    <>
                      <circle cx={cx} cy={cy} r={star.r * 0.6} fill={star.color} />
                      <line
                        x1={cx - star.r * 3}
                        y1={cy}
                        x2={cx + star.r * 3}
                        y2={cy}
                        stroke={star.color}
                        strokeWidth={0.8}
                        strokeOpacity={0.5}
                      />
                      <line
                        x1={cx}
                        y1={cy - star.r * 3}
                        x2={cx}
                        y2={cy + star.r * 3}
                        stroke={star.color}
                        strokeWidth={0.8}
                        strokeOpacity={0.5}
                      />
                    </>
                  ) : (
                    <circle cx={cx} cy={cy} r={star.r} fill={star.color} />
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
