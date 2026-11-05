import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import type { ContactInfo, ContactItem, SiteLabels } from '../config'

interface ContactPanelProps {
  contact: ContactInfo
  labels: SiteLabels
  onUpdate: (next: ContactInfo) => void
}

/** 生成下一个联系项的唯一 id */
function makeContactId() {
  return `ct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/** 如果 contact 没有 items 数组，从旧字段兜底生成（兼容老版本 localStorage） */
function ensureItems(contact: ContactInfo): ContactItem[] {
  if (Array.isArray(contact.items) && contact.items.length > 0) return contact.items
  const legacy: ContactItem[] = []
  if (contact.email) legacy.push({ id: 'legacy-email', title: '邮箱', value: contact.email })
  if (contact.phone) legacy.push({ id: 'legacy-phone', title: '电话', value: contact.phone })
  if (contact.wechat) legacy.push({ id: 'legacy-wechat', title: '微信', value: contact.wechat })
  if (contact.location) legacy.push({ id: 'legacy-location', title: '所在地', value: contact.location })
  return legacy
}

/** 根据 title 猜测最合适的链接 href（仅非编辑态生效） */
function guessHref(item: ContactItem): string | null {
  const t = item.title.toLowerCase()
  const v = item.value.trim()
  if (t.includes('邮箱') || t.includes('email')) return `mailto:${v}`
  if (t.includes('电话') || t.includes('tel') || t.includes('phone')) return `tel:${v.replace(/[^0-9+]/g, '')}`
  if (/^https?:\/\//i.test(v)) return v
  return null
}

const rowInputClass =
  'w-full rounded-md border border-aurora/50 bg-[#1B2A4A]/80 px-2 py-1.5 text-[12.5px] leading-5 text-paper outline-none transition-colors duration-200 placeholder:text-muted/40 focus:border-aurora'

/**
 * "保持联系" 浮层内容 —— 全部可增删改
 * - 每一条联系项点击文字 → **直接原地变成 input 行内编辑**（无弹窗、无展开卡）
 * - 右键联系项 → 居中 modal 删除确认（仅在该行上阻止原生菜单）
 * - 底部 "＋ 添加联系项" → 追加空白条目并自动进入行内编辑态
 * - 按 Esc / 点击其他行 / 点击面板空白处 → 退出编辑
 * - 所有改动自动持久化到 localStorage（走 App 的 updateContact 回调）
 */
export default function ContactPanel({ contact, labels, onUpdate }: ContactPanelProps) {
  const items = ensureItems(contact)

  /** 当前处于"行内编辑态"的联系项 id（null = 全部展示态） */
  const [editingId, setEditingId] = useState<string | null>(null)
  /** 右键删除确认的联系项 id */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  /** 编辑态输入框的 ref：进入编辑后自动聚焦 value 输入框（首击即编辑） */
  const valueInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editingId) {
      // 等 DOM 更新后再 focus，保证首击就能直接输入
      requestAnimationFrame(() => valueInputRef.current?.focus())
    }
  }, [editingId])

  /** 全局 Esc 退出编辑 */
  useEffect(() => {
    if (!editingId) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingId(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [editingId])

  const handleAddContact = () => {
    const newItem: ContactItem = {
      id: makeContactId(),
      title: labels.contactAddPlaceholderTitle,
      value: labels.contactAddPlaceholderValue,
    }
    onUpdate({ ...contact, items: [...items, newItem] })
    // 立即进入行内编辑态
    setEditingId(newItem.id)
  }

  const handleContextMenu = (event: ReactMouseEvent, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    // 右键时顺带退出该行的编辑态（避免同时"编辑"又"删除"）
    if (editingId === id) setEditingId(null)
    setPendingDeleteId(id)
  }

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    const target = pendingDeleteId
    onUpdate({ ...contact, items: items.filter((item) => item.id !== target) })
    if (editingId === target) setEditingId(null)
    setPendingDeleteId(null)
  }

  const handleItemChange = (id: string, patch: Partial<ContactItem>) => {
    onUpdate({
      ...contact,
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })
  }

  /** 点击行（或行内非 input 元素）→ 进入该行的行内编辑 */
  const enterInlineEdit = (id: string) => {
    setEditingId(id)
  }

  return (
    <div className="space-y-5">
      {/* 联系项列表 */}
      <ul
        className="divide-y divide-white/[0.06]"
        onClick={(e) => {
          // 点击列表内任意非编辑元素的空白处 → 退出编辑
          if (e.target === e.currentTarget) setEditingId(null)
        }}
      >
        {items.map((item) => {
          const isEditing = item.id === editingId
          const isDeleting = item.id === pendingDeleteId
          const href = !isEditing ? guessHref(item) : null
          const RowTag = href ? 'a' : 'div'
          const rowProps: Record<string, unknown> = href
            ? { href, target: '_blank', rel: 'noopener noreferrer' }
            : {}

          return (
            <li key={item.id}>
              <RowTag
                {...(rowProps as object)}
                role={href ? undefined : 'button'}
                tabIndex={href ? undefined : 0}
                onClick={(e: ReactMouseEvent) => {
                  if (href) {
                    // 有链接 → 左键直接打开；不进入编辑态
                    return
                  }
                  if (!isEditing) {
                    e.stopPropagation()
                    enterInlineEdit(item.id)
                  }
                }}
                onKeyDown={(e: ReactKeyboardEvent) => {
                  if (isEditing) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    enterInlineEdit(item.id)
                  }
                }}
                onContextMenu={(e: ReactMouseEvent) => handleContextMenu(e, item.id)}
                className={`flex items-start justify-between gap-6 py-4 transition-colors duration-200 ${
                  isEditing
                    ? 'bg-aurora/[0.06] cursor-text rounded-lg px-1'
                    : href
                      ? 'cursor-pointer hover:text-aurora'
                      : 'cursor-text hover:bg-white/[0.02]'
                } ${isDeleting ? 'bg-ember/10' : ''}`}
              >
                {/* 左侧标题：展示态是纯文字 / 编辑态变成 input */}
                {isEditing ? (
                  <input
                    className={`${rowInputClass} shrink-0 max-w-[140px]`}
                    aria-label="联系项标题"
                    placeholder={labels.contactAddPlaceholderTitle}
                    value={item.title}
                    onChange={(event) => handleItemChange(item.id, { title: event.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        setEditingId(null)
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="shrink-0 text-xs tracking-wide text-muted">
                    {item.title || '未命名'}
                  </span>
                )}

                {/* 右侧值：展示态是 <a> 链接 / 编辑态变成 input */}
                {isEditing ? (
                  <input
                    ref={valueInputRef}
                    className={`${rowInputClass} text-right`}
                    aria-label="联系项内容"
                    placeholder={labels.contactAddPlaceholderValue}
                    value={item.value}
                    onChange={(event) => handleItemChange(item.id, { value: event.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        setEditingId(null)
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="break-all text-right text-sm text-paper/90 transition-colors duration-200 hover:text-aurora">
                    {item.value || '（空）'}
                  </span>
                )}
              </RowTag>
            </li>
          )
        })}
      </ul>

      {/* 添加联系项按钮 */}
      <button
        type="button"
        onClick={handleAddContact}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3.5 py-3 text-[12px] tracking-wide text-muted transition-colors duration-200 hover:border-aurora/50 hover:text-aurora"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        {labels.contactAdd}
      </button>

      {/* 右键删除确认浮层（居中 modal，和 SkillsPanel 同款视觉） */}
      {pendingDeleteId && (() => {
        const target = items.find((s) => s.id === pendingDeleteId)
        if (!target) return null
        return (
          <div
            className="fixed left-1/2 top-1/2 z-[60] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ember/40 bg-ink/98 px-5 py-4 text-paper shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-[12px] leading-relaxed text-paper/90">
              {labels.contactDeleteConfirm}
            </p>
            <p className="mb-3 truncate text-[11px] text-muted/80">
              「{target.title || '未命名'}」· {target.value || '（空）'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-md border border-white/10 px-3 py-1 text-[11px] text-muted transition-colors hover:text-paper"
              >
                {labels.contactDeleteCancelBtn}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-md border border-ember/60 bg-ember/10 px-3 py-1 text-[11px] text-ember transition-colors hover:bg-ember/20"
              >
                {labels.contactDeleteConfirmBtn}
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
