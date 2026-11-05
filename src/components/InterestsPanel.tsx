import { useEffect, useRef, useState } from 'react'

interface InterestsPanelProps {
  /** 一整段兴趣介绍文字 */
  interests: string
  onUpdate: (next: string) => void
}

const textareaClass =
  'w-full resize-none rounded-xl border border-aurora/60 bg-[#1B2A4A]/70 px-4 py-3.5 text-[14px] leading-7 text-paper outline-none transition-colors duration-200 focus:border-aurora'

/**
 * "兴趣特长" 浮层内容 —— 一整段文字介绍
 * - 展示态：一段排版舒适的介绍文字（和另外两个面板的内容区风格统一）
 * - 左键点击文字 → **原地变成多行输入框行内编辑**（自动聚焦）
 * - 输入即保存；Enter 换行 / Esc 或点击别处退出编辑
 * - 内容持久化到 localStorage（走 App 的 updateInterests 回调）
 */
export default function InterestsPanel({ interests, onUpdate }: InterestsPanelProps) {
  /** 是否处于行内编辑态 */
  const [editing, setEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [editing])

  /** 全局 Esc 退出编辑 */
  useEffect(() => {
    if (!editing) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [editing])

  return (
    <div className="space-y-5">
      {editing ? (
        /* 编辑态：原地变多行输入框 */
        <textarea
          ref={textareaRef}
          rows={8}
          className={textareaClass}
          aria-label="兴趣特长介绍"
          value={interests}
          onChange={(event) => onUpdate(event.target.value)}
          onBlur={() => setEditing(false)}
        />
      ) : (
        /* 展示态：一段介绍文字，点击进入编辑 */
        <p
          role="button"
          tabIndex={0}
          aria-label="兴趣特长介绍，点击编辑"
          onClick={() => setEditing(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setEditing(true)
            }
          }}
          className={`cursor-text whitespace-pre-wrap rounded-xl border border-transparent px-4 py-3.5 text-[14px] leading-7 text-paper/85 transition-colors duration-200 hover:border-aurora/40 hover:bg-white/[0.02] ${
            interests.trim() ? '' : 'text-muted/60 italic'
          }`}
        >
          {interests.trim() ? interests : '（点击填写你的兴趣介绍…）'}
        </p>
      )}

      <p className="text-[10px] text-muted/50">
        点击文字可编辑这段介绍；输入即时保存，刷新后保留。
      </p>
    </div>
  )
}
