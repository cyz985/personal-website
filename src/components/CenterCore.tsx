/**
 * 中心载体：横向薄水晶光椭圆（严格对标参考图）
 * - 造型：横向轻微椭圆（约 1.95 : 1），不是正圆
 * - 质感：盘面通透（能看到背后星空），靠近描边处才有一点点淡紫玻璃沉积
 * - 光环：细的粉→紫→蓝渐变流光描边，双线错位 + 白色芯线，做出薄水晶壁的厚度
 * - 光晕：外围光晕刻意压低，内敛柔和，不抢星球视觉重心
 * - 立体：顶部内侧折射高光 + 底部内阴影 + 底缘一线厚度暗边，克制的水晶层次
 * - 文字：洒脱舒展的毛笔书法字（Ma Shan Zheng），暖白色，居中清晰
 * - 点击跳转到个人介绍页面；hover 保留柔和高亮
 * 3D 感全部由 SVG 几何绘制，不使用 CSS 3D 变换，文字始终矢量清晰
 */

import { useRef } from 'react'

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

/** 载体尺寸（像素）：横向轻微椭圆，宽高比约 1.95:1 */
const W = 214
const H = 110
const CX = W / 2
const CY = H / 2
/** 主描边半径（留 3px 给外发光溢出） */
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

export default function CenterCore({ ariaLabel, hint, name, onOpen }: CenterCoreProps) {
  /** 按下位置：拖拽超过阈值时不视为点击 */
  const pressRef = useRef<{ x: number; y: number } | null>(null)

  return (
    <div className="relative" style={{ width: W, height: H }}>
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
              {/* 流光描边：左下粉 → 紫 → 右上浅蓝 */}
              <linearGradient id="core-rim" x1="4%" y1="96%" x2="96%" y2="4%">
                <stop offset="0%" stopColor="#FF7FC4" />
                <stop offset="24%" stopColor="#E378EC" />
                <stop offset="50%" stopColor="#B18CFF" />
                <stop offset="74%" stopColor="#8FB6FF" />
                <stop offset="100%" stopColor="#86E6FF" />
              </linearGradient>
              {/* 暖粉段：左下到左侧、底部的暖色流光 */}
              <linearGradient id="core-rim-warm" x1="30%" y1="100%" x2="100%" y2="40%">
                <stop offset="0%" stopColor="#FF6FAE" />
                <stop offset="45%" stopColor="#FF8FD0" />
                <stop offset="100%" stopColor="#FFC9E8" />
              </linearGradient>
              {/* 冷蓝段：右侧到顶部的冷色流光 */}
              <linearGradient id="core-rim-cool" x1="100%" y1="60%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#7FE9FF" />
                <stop offset="48%" stopColor="#8FBFFF" />
                <stop offset="100%" stopColor="#C9B4FF" />
              </linearGradient>
              {/* 白色芯线：玻璃壁最亮的反光 */}
              <linearGradient id="core-core-line" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFE2F4" stopOpacity="0.55" />
                <stop offset="34%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="66%" stopColor="#EAFAFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#D6F6FF" stopOpacity="0.6" />
              </linearGradient>
              {/* 盘面：几乎透明，只在贴近描边处沉积一点点淡紫 */}
              <radialGradient id="core-glass" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0B0820" stopOpacity="0" />
                <stop offset="56%" stopColor="#171040" stopOpacity="0.12" />
                <stop offset="82%" stopColor="#281A5A" stopOpacity="0.3" />
                <stop offset="94%" stopColor="#3A266F" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#4A3184" stopOpacity="0.5" />
              </radialGradient>
              {/* 底部内阴影：让椭圆底部有一点点厚度 */}
              <linearGradient id="core-bottom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#05030F" stopOpacity="0" />
                <stop offset="55%" stopColor="#05030F" stopOpacity="0" />
                <stop offset="100%" stopColor="#05030F" stopOpacity="0.55" />
              </linearGradient>
              {/* 顶部内侧折射高光 */}
              <linearGradient id="core-spec" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="52%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="80%" stopColor="#E9F7FF" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>

              {/* 内容裁剪：所有内层光影都限制在椭圆内 */}
              <clipPath id="core-clip">
                <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
              </clipPath>
            </defs>

            {/* 外围极轻的光晕：亮度压低，不刺眼、不抢星球重心 */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="url(#core-rim)"
              strokeWidth={18}
              strokeOpacity={0.05}
            />
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="url(#core-rim)"
              strokeWidth={7}
              strokeOpacity={0.11}
            />

            {/* 通透盘面（能看到背后的星空） */}
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#core-glass)" />

            {/* 盘内光影层（裁剪在椭圆内，避免溢出成雾） */}
            <g clipPath="url(#core-clip)">
              {/* 底部内阴影 */}
              <ellipse
                cx={CX}
                cy={CY + 2}
                rx={RX - 1}
                ry={RY - 1}
                fill="none"
                stroke="url(#core-bottom)"
                strokeWidth={16}
                opacity={0.55}
              />
              {/* 顶部内侧折射高光弧 */}
              <path
                d={arcPath(202, 338, RX - 7, RY - 7)}
                fill="none"
                stroke="url(#core-spec)"
                strokeWidth={5}
                strokeOpacity={0.45}
                strokeLinecap="round"
              />
              {/* 内侧淡淡的玻璃壁回光，增加壁厚层次 */}
              <ellipse
                cx={CX}
                cy={CY}
                rx={RX - 9}
                ry={RY - 9}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={0.12}
                strokeWidth={2.2}
              />
            </g>

            {/* 盘体厚度：底缘一线暗边 */}
            <ellipse
              cx={CX}
              cy={CY + 1.8}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="#1B1038"
              strokeOpacity={0.42}
              strokeWidth={3.4}
            />

            {/* 光壁厚度：贴着主描边的一层薄光，让细线有水晶壁的厚度 */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="url(#core-rim)"
              strokeWidth={5}
              strokeOpacity={0.3}
            />

            {/* 主描边：细的粉蓝流光 */}
            <ellipse
              className="core-edge-glow"
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="url(#core-rim)"
              strokeWidth={2.8}
            />

            {/* 外圈错位暖粉流光：制造双线流动感（与冷色段轻微交叠，接缝自然） */}
            <path
              d={arcPath(88, 272, RX + 1.6, RY + 1.3)}
              fill="none"
              stroke="url(#core-rim-warm)"
              strokeWidth={2.6}
              strokeOpacity={0.85}
              strokeLinecap="round"
            />
            {/* 内圈错位冷蓝流光 */}
            <path
              d={arcPath(262, 448, RX - 1.8, RY - 1.4)}
              fill="none"
              stroke="url(#core-rim-cool)"
              strokeWidth={2.2}
              strokeOpacity={0.8}
              strokeLinecap="round"
            />

            {/* 白色芯线：玻璃壁最亮的一道反光 */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              fill="none"
              stroke="url(#core-core-line)"
              strokeWidth={1.05}
              strokeOpacity={0.9}
            />

            {/* 顶部镜面反光：让上方描边同样清晰锐利（只提线本身亮度，不加外晕） */}
            <path
              d={arcPath(238, 302)}
              fill="none"
              stroke="#FFF6FB"
              strokeWidth={1.6}
              strokeOpacity={0.75}
              strokeLinecap="round"
            />
          </svg>

          {/* 名字：毛笔行书，暖白色，始终正对镜头、清晰锐利 */}
          <span
            className="core-name pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap"
            style={{
              fontFamily: "'Ma Shan Zheng', 'Noto Serif SC', 'STKaiti', serif",
              fontSize: Math.min(56, Math.round(168 / name.length)),
              lineHeight: 1,
              letterSpacing: 2,
              transform: 'scaleX(0.84)',
              color: '#F9F1E0',
              WebkitTextStroke: '0.4px rgba(250, 242, 226, 0.9)',
              textShadow:
                '0 0 16px rgba(255, 226, 190, 0.38), 0 0 3px rgba(255, 240, 220, 0.5), 0 2px 6px rgba(0, 0, 0, 0.45)',
              paddingBottom: 2,
            }}
          >
            {name}
          </span>
        </span>
      </button>

      {/* 椭圆下方小字提示：位置、字号保持不变 */}
      <span className="core-hint hint-breathe pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-[0.16em] text-muted/75">
        {hint}
      </span>
    </div>
  )
}
