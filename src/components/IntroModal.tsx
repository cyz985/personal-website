import { useEffect } from 'react'
import type { PersonalInfo } from '../config'

interface IntroModalProps {
  open: boolean
  personal: PersonalInfo
  onClose: () => void
}

/**
 * 个人介绍弹窗
 * - 点击中心圆盘打开，点击右上角关闭按钮 / 遮罩 / ESC 关闭
 * - 内容来自 personal.introduction 与 personal.strengths，可在编辑面板中修改
 * - 视觉与页面水晶星空风格一致：深蓝紫半透明底 + 细彩色描边 + 柔和外光
 * - 不加额外动画，避免干扰主页面既有动效
 */
export default function IntroModal({ open, personal, onClose }: IntroModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const paragraphs = (personal.introduction ?? []).filter((line) => line.trim().length > 0)
  const strengths = (personal.strengths ?? []).filter((line) => line.trim().length > 0)
  const subtitle = [personal.school, personal.className].filter(Boolean).join(' · ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`${personal.name} · 个人介绍`}
    >
      {/* 半透明遮罩：点击关闭弹窗 */}
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-[min(92vw,540px)] max-h-[82vh] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-[#26375C]/95 to-[#1A2742]/95 p-7 shadow-[0_20px_60px_rgba(11,20,40,0.55)]">
        {/* 顶部一线彩色光边，呼应中心圆环 */}
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, #FFB370, #F2A6DC, #C7A6FF, #7FD8FF, transparent)',
            opacity: 0.75,
          }}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="关闭个人介绍"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted/75 transition-colors duration-200 hover:border-ember/50 hover:text-ember"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <p className="text-[10px] uppercase tracking-[0.32em] text-muted/60">关于我</p>
        <h2 className="mt-2 font-serif text-2xl font-black tracking-[0.14em] text-paper">
          {personal.name}
        </h2>
        {personal.nameEn ? (
          <p className="mt-1 text-[11px] tracking-[0.22em] text-muted/60">{personal.nameEn}</p>
        ) : null}
        {subtitle ? <p className="mt-2 text-xs text-muted/75">{subtitle}</p> : null}

        <div className="mt-5 space-y-3 border-t border-white/[0.08] pt-5">
          {paragraphs.length > 0 ? (
            paragraphs.map((line, index) => (
              <p key={index} className="text-[13px] leading-7 text-paper/85">
                {line}
              </p>
            ))
          ) : (
            <p className="text-[13px] leading-7 text-muted/60">暂未填写个人介绍，可在编辑面板中添加。</p>
          )}
        </div>

        {strengths.length > 0 ? (
          <div className="mt-6 border-t border-white/[0.08] pt-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted/55">能力特点</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {strengths.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-[12.5px] leading-6 text-paper/80">
                  <span
                    className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ember/80"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {personal.email || personal.phone ? (
          <div className="mt-6 border-t border-white/[0.08] pt-4 text-[11px] tracking-wide text-muted/65">
            {personal.email ? <span className="mr-4">邮箱：{personal.email}</span> : null}
            {personal.phone ? <span>联系：{personal.phone}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
