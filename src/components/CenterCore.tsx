/**
 * 中心圆盘：清透水晶光环（干净透明渐变底 + 清晰彩色环）
 * - 盘面只有极低透明度的蓝紫渐变，星空白底透出来，不做任何灰遮罩 / 雾面叠加
 * - 圆环为暖橙 → 粉紫 → 淡紫 → 浅蓝的清晰渐变，细而亮，不做模糊厚边
 * - 仅保留一档很轻的贴边亮线，去掉大面积外层柔光
 * - 3D 感全部由 SVG 几何绘制（正交视角，无 CSS 3D 变换），不产生位图重采样
 * - "林知远"文字放在独立等比正交 SVG 层，不受盘面椭圆拉伸，永远正对镜头、清晰锐利
 * 点击跳转到个人介绍页面，hover 轻微上浮 + 暖橙柔光
 */

import { useRef } from 'react'

interface CenterCoreProps {
  /** 无障碍标签 */
  ariaLabel: string
  /** 圆下方的小字提示 */
  hint: string
  /** 中心展示的名字 */
  name: string
  /** 左键单击圆盘：跳转到个人介绍独立页面 */
  onOpen: () => void
}

export default function CenterCore({ ariaLabel, hint, name, onOpen }: CenterCoreProps) {
  // 自适应字号：粗笔重墨衬线字视觉占位更大，留更多边距防溢出
  const CHAR_WIDTH = 1.06 // 中文字每字约占字号的 1.06 倍宽
  const INNER_R = 34
  const available = INNER_R * 2 * 0.82 // 粗衬线字厚，留足边距 + letterSpacing 空间
  const fontSize = Math.min(available / (name.length * CHAR_WIDTH), available * 0.54)
  /** 按下位置：拖拽超过阈值时不视为点击 */
  const pressRef = useRef<{ x: number; y: number } | null>(null)

  return (
    <div className="relative h-[142px] w-[162px]">
      {/* 只有圆盘（椭圆）范围内可点击，圆盘外不响应 */}
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
          {/* 盘面层：椭圆透视完全靠几何绘制，不做 CSS 3D 变换 */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              {/* 圆环渐变：暖橙 → 粉紫 → 淡紫 → 浅蓝，清晰不浑浊 */}
              <linearGradient id="core-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB370" />
                <stop offset="36%" stopColor="#F2A6DC" />
                <stop offset="66%" stopColor="#C7A6FF" />
                <stop offset="100%" stopColor="#7FD8FF" />
              </linearGradient>
              {/* 圆环内层的浅色高光：让边缘更锐利立体（不是雾） */}
              <linearGradient id="core-ring-inner" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFD9B0" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#F7DCFF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#BEEBFF" stopOpacity="0.55" />
              </linearGradient>
              {/* 盘面底色：几乎全透明，只剩极淡的一层冰蓝，后方星空直接透出 */}
              <radialGradient id="core-panel" cx="50%" cy="38%" r="72%">
                <stop offset="0%" stopColor="#A8C6F0" stopOpacity="0.07" />
                <stop offset="48%" stopColor="#6C8CB8" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#3A4E75" stopOpacity="0.015" />
              </radialGradient>
              {/* 表面轻微色温：左上暖橙、中下淡紫，都极淡 */}
              <radialGradient id="core-tint-warm" cx="32%" cy="26%" r="70%">
                <stop offset="0%" stopColor="#FFB370" stopOpacity="0.13" />
                <stop offset="100%" stopColor="#FFB370" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="core-tint-violet" cx="52%" cy="84%" r="72%">
                <stop offset="0%" stopColor="#C7A6FF" stopOpacity="0.09" />
                <stop offset="100%" stopColor="#C7A6FF" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 盘面：透明渐变底，无任何灰遮罩 */}
            <ellipse cx="50" cy="50" rx="46" ry="46" fill="url(#core-panel)" />

            {/* 极淡色温叠加，保持水晶的通透而不是死蓝 */}
            <ellipse cx="50" cy="50" rx="46" ry="46" fill="url(#core-tint-warm)" />
            <ellipse cx="50" cy="50" rx="46" ry="46" fill="url(#core-tint-violet)" />

            {/* hover 时才亮起的暖橙光晕（默认完全透明，平时不可见） */}
            <circle className="core-halo" cx="50" cy="50" r="44" />

            {/* 盘体厚度：只在下缘露出一线彩色侧壁，薄且干净 */}
            <ellipse
              cx="50"
              cy="51.4"
              rx="46"
              ry="46"
              fill="none"
              stroke="url(#core-ring)"
              strokeOpacity="0.16"
              strokeWidth="1.3"
            />

            {/* 主圆环：清晰彩色细环 + 静态贴边辉光 */}
            <ellipse
              className="core-edge-glow"
              cx="50"
              cy="50"
              rx="46"
              ry="46"
              fill="none"
              stroke="url(#core-ring)"
              strokeWidth="2"
            />

            {/* 环内侧一圈浅色高光线，只在上半部明显，增加环的清晰度 */}
            <ellipse
              cx="50"
              cy="50"
              rx="44.6"
              ry="44.6"
              fill="none"
              stroke="url(#core-ring-inner)"
              strokeWidth="0.8"
            />

            {/* 外圈极轻的亮线：替代大面积柔光光晕 */}
            <ellipse
              cx="50"
              cy="50"
              rx="48"
              ry="48"
              fill="none"
              stroke="url(#core-ring)"
              strokeOpacity="0.13"
              strokeWidth="0.8"
            />

            {/* 内圈细纹 */}
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="#C7A6FF"
              strokeOpacity="0.22"
              strokeWidth="1"
            />

            {/* 暖橙进度弧 + 端点小圆点（位置不变，提亮增强发光感但不雾化） */}
            <path
              className="core-arc-glow"
              d="M 50 18 A 32 32 0 0 1 80.5 66"
              fill="none"
              stroke="#FFB370"
              strokeOpacity="0.95"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="80.5" cy="66" r="2.8" fill="#BEEBFF" />
          </svg>

          {/* 文字层：等比正交渲染，不随盘面椭圆拉伸，永远正对镜头、清晰锐利 */}
          <svg
            viewBox="0 0 100 100"
            className="absolute left-1/2 top-1/2 h-[154px] w-[154px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            aria-hidden="true"
          >
            <text
              className="core-name"
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontFamily="'Noto Serif SC', '思源宋体', 'SimSun', serif"
              fontWeight={900}
              letterSpacing={fontSize * 0.2}
              fill="#FBF7EE"
              stroke="#0B1428"
              strokeOpacity="0.6"
              strokeWidth="0.7"
              paintOrder="stroke"
            >
              {name}
            </text>
          </svg>
        </span>
      </button>

      {/* 中心下方小字提示：比名字弱一档，保持柔和但清楚 */}
      <span className="core-hint hint-breathe pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-[0.16em] text-muted/75">
        {hint}
      </span>
    </div>
  )
}
