/**
 * 中心载体：横向水晶琉璃光环椭圆（严格对标参考图）
 * - 造型：横向椭圆（约 2 : 1），不是正圆
 * - 材质：一层连续的冷暖渐变琉璃环——暖粉橙在左/左下，冰蓝在右/右上，
 *         外层柔光 + 内层细流光 + 白色折射芯线，连续不断，没有分段霓虹感
 * - 立体：顶部折射高光、内侧回光、底部柔和投影，悬浮的厚玻璃质感
 * - 环内：半透深色底 + 细碎微弱星点
 * - 文字：毛笔行书（Ma Shan Zheng），纯白、水平端正，居中
 * - 点击跳转到个人介绍页面；hover 保留柔和高亮
 * - 响应式：整体以视口为基准等比缩放，椭圆/装饰/文字/小字统一同一系数
 * 光环与文字均为矢量绘制，缩放后依旧清晰
 */

import { useRef } from 'react'
import type { CSSProperties } from 'react'

interface CenterCoreProps {
  /** 无障碍标签 */
  ariaLabel: string
  /** 椭圆下方的小字提示 */
  hint: string
  /** 中心展示的名字 */
  name: string
  /** 左键单击椭圆：跳转到个人介绍独立页面 */
  onOpen: () => void
}

/** 载体尺寸（像素）：横向椭圆，宽高比约 2:1 */
const W = 252
const H = 126
/** 等比缩放的基准视口：组件整体尺寸随视口按这一基准换算成 vw / vh */
const BASE_W = 1440
const BASE_H = 900
const CX = W / 2
const CY = H / 2
/** 主描边半径（留出外发光溢出的余量） */
const RX = W / 2 - 3
const RY = H / 2 - 3

/** 椭圆参数点（角度制，0° 在右侧，顺时针为正） */
function pointAt(deg: number, rx = RX, ry = RY): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [CX + rx * Math.cos(rad), CY + ry * Math.sin(rad)]
}

/** 沿椭圆取一段弧的 path（sweep = 顺时针） */
function arcPath(from: number, to: number, rx = RX, ry = RY): string {
  const [x1, y1] = pointAt(from, rx, ry)
  const [x2, y2] = pointAt(to, rx, ry)
  const largeArc = Math.abs(to - from) > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

/** 环内细碎星点（相对坐标，避开正中的文字区域） */
const INNER_STARS: [number, number, number, number][] = [
  [0.2, 0.34, 0.9, 0.45],
  [0.31, 0.24, 0.7, 0.35],
  [0.44, 0.2, 0.6, 0.3],
  [0.66, 0.26, 0.8, 0.4],
  [0.8, 0.36, 0.6, 0.3],
  [0.74, 0.68, 0.9, 0.4],
  [0.6, 0.78, 0.7, 0.32],
  [0.36, 0.76, 0.8, 0.36],
  [0.22, 0.62, 0.6, 0.28],
]

export default function CenterCore({ ariaLabel, hint, name, onOpen }: CenterCoreProps) {
  /** 按下位置：拖拽超过阈值时不视为点击 */
  const pressRef = useRef<{ x: number; y: number } | null>(null)

  /** 名字字号与字距：都以组件宽度为基准换算成相对单位，随整体一起缩放 */
  const nameSize = Math.min(56, Math.round(166 / name.length))
  const ratio = (px: number) => `${(px / W).toFixed(5)}`

  return (
    <div
      className="relative"
      style={
        {
          // 组件宽度随视口等比变化，高度严格保持 2:1
          '--core-w': `min(${((W / BASE_W) * 100).toFixed(2)}vw, ${((W / BASE_H) * 100).toFixed(2)}vh)`,
          '--core-h': 'calc(var(--core-w) * 0.5)',
          width: 'var(--core-w)',
          height: 'var(--core-h)',
        } as CSSProperties
      }
    >
      {/* 只有椭圆范围内可点击，椭圆外不响应 */}
      <button
        type="button"
        onPointerDown={(event) => {
          pressRef.current = { x: event.clientX, y: event.clientY }
        }}
        onClick={(event) => {
          // 仅左键单击，且按下后没有明显拖动才触发
          if (event.button !== 0) return
          const press = pressRef.current
          if (
            press &&
            (Math.abs(event.clientX - press.x) > 3 || Math.abs(event.clientY - press.y) > 3)
          ) {
            return
          }
          onOpen()
        }}
        aria-label={ariaLabel}
        className="core-link absolute inset-0 block rounded-full border-0 bg-transparent p-0"
      >
        <span className="core-float relative block h-full w-full">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              {/* 琉璃环主渐变：左/左下暖粉橙 → 中段淡紫 → 右/右上冰蓝，一整圈连续过渡 */}
              <linearGradient id="core-rim" x1="1%" y1="66%" x2="99%" y2="36%">
                <stop offset="0%" stopColor="#FF9A62" />
                <stop offset="14%" stopColor="#FF83B2" />
                <stop offset="32%" stopColor="#F07FDD" />
                <stop offset="50%" stopColor="#C08CFF" />
                <stop offset="68%" stopColor="#93A8FF" />
                <stop offset="84%" stopColor="#7FCBFF" />
                <stop offset="100%" stopColor="#8CF0FF" />
              </linearGradient>
              {/* 内层细流光：比主线更冷一点，形成双层玻璃壁 */}
              <linearGradient id="core-rim-inner" x1="4%" y1="70%" x2="96%" y2="40%">
                <stop offset="0%" stopColor="#FFC2A0" stopOpacity="0.9" />
                <stop offset="26%" stopColor="#FFA6CE" stopOpacity="0.9" />
                <stop offset="52%" stopColor="#D2B0FF" stopOpacity="0.9" />
                <stop offset="76%" stopColor="#A8D4FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#C3F6FF" stopOpacity="0.9" />
              </linearGradient>
              {/* 白色折射芯线：玻璃最亮的一道反光 */}
              <linearGradient id="core-core-line" x1="0%" y1="72%" x2="100%" y2="30%">
                <stop offset="0%" stopColor="#FFF4E8" stopOpacity="0.5" />
                <stop offset="24%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="52%" stopColor="#FFFFFF" stopOpacity="0.98" />
                <stop offset="78%" stopColor="#F0FBFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#DFF8FF" stopOpacity="0.6" />
              </linearGradient>
              {/* 环内半透深色底：中间更透，靠近环壁略沉，保证环是主角 */}
              <radialGradient id="core-glass" cx="50%" cy="46%" r="58%">
                <stop offset="0%" stopColor="#0C0820" stopOpacity="0.24" />
                <stop offset="52%" stopColor="#120C2A" stopOpacity="0.34" />
                <stop offset="82%" stopColor="#1C1240" stopOpacity="0.46" />
                <stop offset="100%" stopColor="#2A1B57" stopOpacity="0.56" />
              </radialGradient>
              {/* 顶部内侧折射高光 */}
              <linearGradient id="core-spec" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="24%" stopColor="#FFFFFF" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="78%" stopColor="#E9F7FF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              {/* 底部内阴影：让玻璃壁下方沉一点点 */}
              <linearGradient id="core-bottom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#05030F" stopOpacity="0" />
                <stop offset="58%" stopColor="#05030F" stopOpacity="0" />
                <stop offset="100%" stopColor="#05030F" stopOpacity="0.45" />
              </linearGradient>

              {/* 柔和底部投影：悬浮感 */}
              <radialGradient id="core-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#160C2E" stopOpacity="0.55" />
                <stop offset="65%" stopColor="#160C2E" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#160C2E" stopOpacity="0" />
              </radialGradient>

              {/* 柔光模糊：让光壁更像玻璃管而不是硬线 */}
              <filter id="core-blur-soft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" />
              </filter>
              <filter id="core-blur-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.2" />
              </filter>
              <filter id="core-blur-shadow" x="-40%" y="-60%" width="180%" height="220%">
                <feGaussianBlur stdDeviation="4.5" />
              </filter>
              {/* 干笔擦痕：给文字边缘加一点毛糙的飞白断续感 */}
              <filter id="core-ink" x="-12%" y="-12%" width="124%" height="124%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.9"
                  numOctaves="2"
                  seed="17"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="1"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>

              {/* 内容裁剪：所有内层光影都限制在椭圆内 */}
              <clipPath id="core-clip">
                <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
              </clipPath>
            </defs>

            {/* 悬浮投影：椭圆正下方的柔和暗影（不发光，只压暗） */}
            <ellipse
              cx={CX}
              cy={CY + RY + 7}
              rx={RX * 0.72}
              ry={7}
              fill="url(#core-shadow)"
              filter="url(#core-blur-shadow)"
            />

            {/* 环外柔光：内敛、连续 */}
            <g filter="url(#core-blur-glow)">
              <ellipse
                cx={CX}
                cy={CY}
                rx={RX}
                ry={RY}
                fill="none"
                stroke="url(#core-rim)"
                strokeWidth={14}
                strokeOpacity={0.05}
              />
            </g>

            {/* 环内半透深色底 */}
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#core-glass)" />

            {/* 环内：细碎微弱的星点（只在文字两侧的留白里） */}
            <g clipPath="url(#core-clip)">
              {INNER_STARS.map(([px, py, r, o], i) => (
                <circle
                  key={i}
                  cx={(px * W).toFixed(1)}
                  cy={(py * H).toFixed(1)}
                  r={r}
                  fill="#E8F1FF"
                  opacity={o}
                />
              ))}
            </g>

            {/* 盘内光影层（裁剪在椭圆内） */}
            <g clipPath="url(#core-clip)">
              {/* 底部内阴影 */}
              <ellipse
                cx={CX}
                cy={CY + 2}
                rx={RX - 1}
                ry={RY - 1}
                fill="none"
                stroke="url(#core-bottom)"
                strokeWidth={15}
                opacity={0.5}
              />
              {/* 顶部内侧折射高光弧 */}
              <path
                d={arcPath(204, 336, RX - 8, RY - 8)}
                fill="none"
                stroke="url(#core-spec)"
                strokeWidth={4.5}
                strokeOpacity={0.42}
                strokeLinecap="round"
              />
              {/* 内侧淡淡的玻璃壁回光 */}
              <ellipse
                cx={CX}
                cy={CY}
                rx={RX - 10}
                ry={RY - 10}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={0.08}
                strokeWidth={3}
              />
            </g>

            {/* 玻璃壁底部厚度：贴着主环的一线暗边 */}
            <ellipse
              cx={CX}
              cy={CY + 1.4}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="#241542"
              strokeOpacity={0.3}
              strokeWidth={3.6}
            />

            {/* 光壁本体：宽一点的柔光层，让环有厚度 */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="url(#core-rim)"
              strokeWidth={7}
              strokeOpacity={0.3}
              filter="url(#core-blur-soft)"
            />

            {/* 环壁内缘的柔光：把主环与内层细线之间的暗缝填起来，像厚玻璃壁 */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX - 4}
              ry={RY - 4}
              fill="none"
              stroke="url(#core-rim)"
              strokeWidth={5}
              strokeOpacity={0.16}
              filter="url(#core-blur-soft)"
            />

            {/* 主流光环线（连续） */}
            <ellipse
              className="core-edge-glow"
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="url(#core-rim)"
              strokeWidth={2.2}
            />

            {/* 外层细高光：玻璃管外壁的反光 */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX - 2.6}
              ry={RY - 2.6}
              fill="none"
              stroke="url(#core-core-line)"
              strokeWidth={0.9}
              strokeOpacity={0.35}
            />

            {/* 内层细流光：第二道环线，形成双层玻璃 */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX - 6.4}
              ry={RY - 6.4}
              fill="none"
              stroke="url(#core-rim-inner)"
              strokeWidth={1.1}
              strokeOpacity={0.55}
            />

            {/* 白色折射芯线：最亮的一道（连续，不断开） */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX - 3.4}
              ry={RY - 3.4}
              fill="none"
              stroke="url(#core-core-line)"
              strokeWidth={1.2}
              strokeOpacity={0.65}
            />

            {/* 顶部镜面高光：只在环线上提亮，不额外加外晕 */}
            <path
              d={arcPath(234, 306)}
              fill="none"
              stroke="#FFF8FB"
              strokeWidth={2}
              strokeOpacity={0.45}
              strokeLinecap="round"
              filter="url(#core-blur-soft)"
            />
            {/* 右下冷色反光 */}
            <path
              d={arcPath(18, 74)}
              fill="none"
              stroke="#DFFBFF"
              strokeWidth={1.6}
              strokeOpacity={0.35}
              strokeLinecap="round"
              filter="url(#core-blur-soft)"
            />

            {/* 环线上的细小光点：像水晶壁里的折射火花 */}
            {[
              [206, 0.9],
              [252, 0.65],
              [318, 0.8],
              [36, 0.6],
            ].map(([deg, o], i) => {
              const [x, y] = pointAt(deg, RX, RY)
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={3.2} fill="#FFF3FA" opacity={0.16 * o} />
                  <circle cx={x} cy={y} r={1.15} fill="#FFFFFF" opacity={0.75 * o} />
                </g>
              )
            })}

            {/* 金粉飞溅：文字周围零星的细金屑，增强笔势的冲击力 */}
            <g aria-hidden="true">
              {[
                [0.24, 0.2, 1.1, 0.75, '#FFD9A0'],
                [0.33, 0.14, 0.7, 0.5, '#FFC98A'],
                [0.72, 0.16, 1, 0.6, '#FFE2B4'],
                [0.86, 0.4, 0.8, 0.45, '#FFB877'],
                [0.16, 0.46, 0.9, 0.5, '#FFD9A0'],
                [0.2, 0.68, 0.7, 0.4, '#FF9C6B'],
                [0.66, 0.84, 1.1, 0.55, '#FFD9A0'],
                [0.4, 0.86, 0.65, 0.4, '#FFC98A'],
                [0.82, 0.7, 0.75, 0.45, '#FFE2B4'],
                [0.55, 0.13, 0.55, 0.35, '#FF9C6B'],
              ].map(([px, py, r, o, c], i) => (
                <circle
                  key={i}
                  cx={(Number(px) * W).toFixed(1)}
                  cy={(Number(py) * H).toFixed(1)}
                  r={Number(r)}
                  fill={String(c)}
                  opacity={Number(o)}
                />
              ))}
              {/* 两缕极细的飞白擦痕，顺着字势向右上甩出 */}
              <path
                d="M 34 78 L 44 70"
                stroke="#FFD9A0"
                strokeWidth={0.7}
                strokeOpacity={0.35}
                strokeLinecap="round"
              />
              <path
                d="M 182 32 L 191 25"
                stroke="#FFE2B4"
                strokeWidth={0.6}
                strokeOpacity={0.3}
                strokeLinecap="round"
              />
            </g>
          </svg>

          {/* 名字：纯白毛笔字，水平端正、基线一致；字号随组件宽度等比缩放 */}
          <span
            className="core-name pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap"
            style={{
              fontFamily: "'Ma Shan Zheng', 'STKaiti', serif",
              fontSize: `calc(var(--core-w) * ${ratio(nameSize)})`,
              lineHeight: 1,
              letterSpacing: `calc(var(--core-w) * ${ratio(2)})`,
              color: '#FFFFFF',
              textShadow: '0 0 8px rgba(255, 255, 255, 0.16)',
              filter: 'url(#core-ink)',
              paddingBottom: `calc(var(--core-w) * ${ratio(2)})`,
            }}
          >
            {name}
          </span>
        </span>
      </button>

      {/* 椭圆下方小字提示：字号与间距同样跟随组件宽度等比缩放 */}
      <span
        className="core-hint hint-breathe pointer-events-none absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap tracking-[0.16em] text-muted/75"
        style={{
          fontSize: `calc(var(--core-w) * ${ratio(11)})`,
          marginTop: `calc(var(--core-w) * ${ratio(8)})`,
        }}
      >
        {hint}
      </span>
    </div>
  )
}
