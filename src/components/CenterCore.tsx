/**
 * 中心圆形面板：干净清晰的深蓝底 + 高亮锐利的名字
 * - 轻微横向椭圆（122×110），与外围椭圆轨道的横宽轮廓呼应
 * - 圆内部无任何模糊 / 雾感；外圈是渐变亮边 + 柔和的径向渐变光晕（无滤镜模糊）
 * - 名字为全中心最亮焦点：浅银白色 + 极薄柔和高光，边缘锐利不模糊
 * 点击会在新标签页打开个人介绍独立页面（#/about）
 * hover 时轻微上浮 + 暖橙柔光（仅 hover 出现）
 */

/** 中心圆组件属性 */
interface CenterCoreProps {
  /** 无障碍标签 */
  ariaLabel: string
  /** 圆下方的小字提示 */
  hint: string
  /** 中心展示的名字 */
  name: string
}

export default function CenterCore({ ariaLabel, hint, name }: CenterCoreProps) {
  // 自适应字号：粗笔重墨衬线字视觉占位更大，留更多边距防溢出
  const CHAR_WIDTH = 1.06 // 中文字每字约占字号的 1.06 倍宽
  const INNER_R = 34
  const available = INNER_R * 2 * 0.82 // 粗衬线字厚，留足边距 + letterSpacing 空间
  const fontSize = Math.min(available / (name.length * CHAR_WIDTH), available * 0.54)

  return (
    <div className="relative">
      <a
        href="/#/about"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="core-link flex h-[110px] w-[122px] items-center justify-center rounded-full"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="core-ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB370" />
              <stop offset="55%" stopColor="#C7A6FF" />
              <stop offset="100%" stopColor="#7FD8FF" />
            </linearGradient>
            {/* 中心面板底色：干净的深蓝径向渐变，中心稍亮、边缘压暗，无雾感 */}
            <radialGradient id="core-panel" cx="50%" cy="44%" r="62%">
              <stop offset="0%" stopColor="#33496F" />
              <stop offset="55%" stopColor="#26395F" />
              <stop offset="100%" stopColor="#1B2A4A" />
            </radialGradient>
            {/* 外围柔和光晕：径向渐变自然淡出（非模糊滤镜），让中心成为视觉核心 */}
            <radialGradient id="core-aura" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#C7A6FF" stopOpacity="0.16" />
              <stop offset="82%" stopColor="#7FD8FF" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#7FD8FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 柔和外晕：从亮边外侧缓缓淡出，无模糊滤镜，文字与边缘始终锐利 */}
          <circle cx="50" cy="50" r="74" fill="url(#core-aura)" pointerEvents="none" />

          {/* hover 时才亮起的暖橙光晕（默认完全透明，平时不可见） */}
          <circle className="core-halo" cx="50" cy="50" r="44" />

          {/* 外环：深蓝面板 + 清晰柔和的渐变亮边（贴边极细辉光，静态滤镜） */}
          <circle
            className="core-edge-glow"
            cx="50"
            cy="50"
            r="46"
            fill="url(#core-panel)"
            stroke="url(#core-ring)"
            strokeOpacity="0.85"
            strokeWidth="2"
          />

          {/* 内圈细纹 */}
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke="#C7A6FF"
            strokeOpacity="0.3"
            strokeWidth="1"
          />

          {/* 中心姓名：思源宋体粗体，重墨方正大气 */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontFamily="'Noto Serif SC', '思源宋体', 'SimSun', serif"
            fontWeight={900}
            letterSpacing={fontSize * 0.20}
            fill="#F7F3EA"
          >
            {name}
          </text>

          {/* 一段暖橙轨道弧 + 一颗小行星（原有装饰，保留） */}
          <path
            d="M 50 18 A 32 32 0 0 1 80.5 66"
            fill="none"
            stroke="#FFB370"
            strokeOpacity="0.72"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="80.5" cy="66" r="2.6" fill="#7FD8FF" fillOpacity="0.8" />
        </svg>
      </a>

      {/* 中心下方小字提示：比名字弱一档，保持柔和但清楚 */}
      <span className="hint-breathe pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-[0.16em] text-muted/75">
        {hint}
      </span>
    </div>
  )
}
