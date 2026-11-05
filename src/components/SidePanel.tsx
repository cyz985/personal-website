import { useEffect, type ReactNode } from 'react'

interface SidePanelProps {
  /** 是否展开 */
  open: boolean
  onClose: () => void
  /** 顶部小标题（英文标识） */
  eyebrow: string
  /** 面板标题 */
  title: string
  /** 标题下方的一句说明（可选） */
  note?: string
  children: ReactNode
}

/**
 * 右侧滑出浮层
 * - 浮层覆盖在画布之上（fixed 定位），不会撑高页面
 * - 打开时画布仍在原位，只是被半透明遮罩虚化
 * - 点击遮罩 / 右上角关闭按钮 / Esc 均可关闭
 */
export default function SidePanel({
  open,
  onClose,
  eyebrow,
  title,
  note,
  children,
}: SidePanelProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <>
      {/* 遮罩：点击关闭，不改变页面高度 */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#0B1526]/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* 右侧浮层：滑入 + 淡入，关闭时缓缓滑出淡出 */}
      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[41] flex w-full max-w-[440px] flex-col border-l border-white/10 bg-[#22345A] shadow-[-24px_0_60px_rgba(9,18,34,0.5)] transition-[transform,opacity] duration-[420ms] ease-out ${
          open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0'
        }`}
      >
        {/* 浮层头部 */}
        <header className="relative shrink-0 border-b border-white/[0.06] px-6 pb-6 pt-7 sm:px-8">
          <p className="flex items-center gap-3 text-[10px] tracking-[0.28em] text-muted">
            <span className="h-px w-6 bg-ember/60" />
            {eyebrow}
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-paper">{title}</h2>
          {note && <p className="mt-3 text-sm leading-7 text-muted">{note}</p>}

          <button
            type="button"
            onClick={onClose}
            aria-label="关闭面板"
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted transition-colors duration-200 hover:border-ember/50 hover:text-ember"
          >
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/* 浮层内容：独立滚动，不影响画布；内容随开合轻微上滑淡入 */}
        <div
          className={`flex-1 overflow-y-auto overscroll-contain px-6 py-7 transition-[opacity,transform] duration-500 ease-out sm:px-8 ${
            open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          {children}
        </div>
      </aside>
    </>
  )
}
