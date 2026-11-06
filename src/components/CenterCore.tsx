/**
 * 中心 3D 圆盘：轻微椭圆透视 + 轻薄边缘 + 清透柔光
 * - 3D 感全部由 SVG 渐变"画"出来（正交视角，无任何 CSS 3D 变换），
 *   不产生位图重采样，盘面边缘与文字永远锐利
 * - 盘面随轨道视角呈轻微横向椭圆（140×124，比例 ≈ cos22°，与轨道俯仰呼应）
 * - 质感清透：底色整体提亮、减淡内阴影与落地光影，光晕收紧为贴边柔光，
 *   不做大面积雾化扩散
 * - "林知远"文字放在独立的等比正交 SVG 层，不受盘面椭圆拉伸，
 *   始终正对镜头、清晰不变形（父级没有 3D 旋转，文字天然正交渲染）
 * 点击在新标签页打开个人介绍（#/about），hover 轻微上浮 + 暖橙柔光
 */

/** 中心圆盘组件属性 */
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
    <div className="relative h-[124px] w-[140px]">
      {/* 静止的环境光影：在盘面下缘露出一条极淡暗带（不随浮动动画移动，衬托悬浮感） */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="core-ground" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B1428" stopOpacity="0.13" />
            <stop offset="55%" stopColor="#0B1428" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0B1428" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="65" rx="40" ry="34" fill="url(#core-ground)" />
      </svg>

      <a
        href="/#/about"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="core-link absolute inset-0 block rounded-full"
      >
        <div className="core-float relative h-full w-full">
          {/* 盘面层：轻微椭圆透视完全靠几何绘制，不做 CSS 3D 变换 */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="core-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB370" />
                <stop offset="55%" stopColor="#C7A6FF" />
                <stop offset="100%" stopColor="#7FD8FF" />
              </linearGradient>
              {/* 盘面底色：水晶质感的半透明深蓝，整体更透、能隐约透出星空 */}
              <radialGradient id="core-panel" cx="50%" cy="42%" r="64%">
                <stop offset="0%" stopColor="#41608E" />
                <stop offset="55%" stopColor="#2F466F" />
                <stop offset="100%" stopColor="#243759" />
              </radialGradient>
              {/* 贴边柔光：极轻的一圈，快速淡出，无雾化扩散 */}
              <radialGradient id="core-aura" cx="50%" cy="50%" r="50%">
                <stop offset="66%" stopColor="#C7A6FF" stopOpacity="0.12" />
                <stop offset="85%" stopColor="#7FD8FF" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#7FD8FF" stopOpacity="0" />
              </radialGradient>
              {/* 表面柔光着色：左上暖橙光源（与星球受光方向一致） */}
              <radialGradient id="core-tint-warm" cx="34%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#FFB370" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#FFB370" stopOpacity="0" />
              </radialGradient>
              {/* 中下部的淡紫反光 */}
              <radialGradient id="core-tint-violet" cx="50%" cy="82%" r="76%">
                <stop offset="0%" stopColor="#C7A6FF" stopOpacity="0.13" />
                <stop offset="100%" stopColor="#C7A6FF" stopOpacity="0" />
              </radialGradient>
              {/* 右下角的浅蓝余光 */}
              <radialGradient id="core-tint-blue" cx="68%" cy="88%" r="70%">
                <stop offset="0%" stopColor="#7FD8FF" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#7FD8FF" stopOpacity="0" />
              </radialGradient>
              {/* 下缘内阴影：只剩极淡一线，厚度感若有若无 */}
              <linearGradient id="core-inner-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#081020" stopOpacity="0" />
                <stop offset="66%" stopColor="#081020" stopOpacity="0" />
                <stop offset="100%" stopColor="#081020" stopOpacity="0.15" />
              </linearGradient>
              {/* 上缘环境光：顶部一线淡紫高光 */}
              <linearGradient id="core-top-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C7A6FF" stopOpacity="0.42" />
                <stop offset="42%" stopColor="#C7A6FF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* 贴边柔光：从亮边外侧快速淡出，清透不雾 */}
            <circle cx="50" cy="50" r="64" fill="url(#core-aura)" pointerEvents="none" />

            {/* 盘体侧壁（厚度）：极薄一线，颜色也随水晶盘变浅 */}
            <ellipse cx="50" cy="51.8" rx="46" ry="46" fill="#16294A" fillOpacity="0.85" />

            {/* 盘面：半透明水晶底 + 渐变亮边（贴边辉光为静态滤镜） */}
            <ellipse
              className="core-edge-glow"
              cx="50"
              cy="50"
              rx="46"
              ry="46"
              fill="url(#core-panel)"
              fillOpacity="0.86"
              stroke="url(#core-ring)"
              strokeOpacity="0.85"
              strokeWidth="2"
            />

            {/* 表面柔光着色：暖橙 → 淡紫 → 浅蓝，通透不浑浊 */}
            <ellipse cx="50" cy="50" rx="46" ry="46" fill="url(#core-tint-warm)" />
            <ellipse cx="50" cy="50" rx="46" ry="46" fill="url(#core-tint-violet)" />
            <ellipse cx="50" cy="50" rx="46" ry="46" fill="url(#core-tint-blue)" />

            {/* hover 时才亮起的暖橙光晕（默认完全透明，平时不可见） */}
            <circle className="core-halo" cx="50" cy="50" r="44" />

            {/* 下缘内阴影 + 上缘一线环境光：若有若无的空间层次 */}
            <ellipse
              cx="50"
              cy="50"
              rx="44.8"
              ry="44.8"
              fill="none"
              stroke="url(#core-inner-shade)"
              strokeWidth="2"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="45.5"
              ry="45.5"
              fill="none"
              stroke="url(#core-top-light)"
              strokeWidth="1"
            />

            {/* 内圈细纹 */}
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="#C7A6FF"
              strokeOpacity="0.28"
              strokeWidth="1"
            />

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

          {/* 文字层：等比正交渲染，不随盘面椭圆拉伸，永远正对镜头、清晰锐利 */}
          <svg
            viewBox="0 0 100 100"
            className="absolute left-1/2 top-1/2 h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            aria-hidden="true"
          >
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={fontSize}
              fontFamily="'Noto Serif SC', '思源宋体', 'SimSun', serif"
              fontWeight={900}
              letterSpacing={fontSize * 0.2}
              fill="#F7F3EA"
            >
              {name}
            </text>
          </svg>
        </div>
      </a>

      {/* 中心下方小字提示：比名字弱一档，保持柔和但清楚 */}
      <span className="hint-breathe pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-[0.16em] text-muted/75">
        {hint}
      </span>
    </div>
  )
}
