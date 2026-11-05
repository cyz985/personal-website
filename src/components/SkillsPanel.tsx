import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import type { SkillItem, SiteLabels } from '../config'

interface SkillsPanelProps {
  skills: SkillItem[]
  labels: SiteLabels
  onUpdate: (next: SkillItem[]) => void
}

/** 生成下一个新技能用的唯一 id */
function makeSkillId() {
  return `sk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * "技能标签" 浮层内容 —— 全部可增删改
 * - 胶囊显示当前技能名，左键点 → 弹出内联编辑卡片
 * - 胶囊上右键 → 弹出自定义删除确认（仅在胶囊上阻止原生菜单）
 * - 底部 "＋ 添加新技能" 按钮 → 追加一条空白条目
 */
export default function SkillsPanel({ skills, labels, onUpdate }: SkillsPanelProps) {
  /** 当前正在编辑/查看的技能 id，null = 未展开任何技能的详情卡 */
  const [activeId, setActiveId] = useState<string | null>(null)
  /** 右键删除确认的技能 id（null = 不显示） */
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const activeSkill = skills.find((s) => s.id === activeId) ?? null

  const handleAddSkill = () => {
    const newSkill: SkillItem = {
      id: makeSkillId(),
      name: labels.skillsAddPlaceholder,
      description: '',
    }
    onUpdate([...skills, newSkill])
    // 自动展开刚加的这条，方便用户立即编辑
    setActiveId(newSkill.id)
  }

  const handleContextMenu = (event: ReactMouseEvent<HTMLSpanElement>, id: string) => {
    // 只在胶囊上阻止原生右键菜单，其他页面区域不受影响
    event.preventDefault()
    event.stopPropagation()
    setPendingDeleteId(id)
  }

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    const target = pendingDeleteId
    onUpdate(skills.filter((item) => item.id !== target))
    if (activeId === target) setActiveId(null)
    setPendingDeleteId(null)
  }

  const cancelDelete = () => setPendingDeleteId(null)

  const handleSkillChange = (id: string, patch: Partial<SkillItem>) => {
    onUpdate(
      skills.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  return (
    <div className="space-y-5">
      {/* 标签胶囊 + 可选的展开详情 */}
      <div className="flex flex-wrap gap-2.5">
        {skills.map((skill) => {
          const isActive = skill.id === activeId
          const isDeleting = skill.id === pendingDeleteId
          return (
            <span
              key={skill.id}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`技能：${skill.name}，点击查看介绍，右键删除`}
              onClick={() => setActiveId(isActive ? null : skill.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setActiveId(isActive ? null : skill.id)
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, skill.id)}
              className={`relative cursor-pointer select-none rounded-full border px-3.5 py-1.5 text-[13px] transition-colors duration-200 ${
                isActive
                  ? 'border-aurora/70 bg-aurora/10 text-aurora'
                  : isDeleting
                    ? 'border-ember/70 bg-ember/10 text-ember'
                    : 'border-white/10 bg-white/[0.03] text-muted hover:border-aurora/60 hover:text-aurora'
              }`}
            >
              {skill.name || '未命名'}
            </span>
          )
        })}
      </div>

      {/* 内联编辑/介绍卡：在选中技能的下方展开 */}
      {activeSkill && (
        <div
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] tracking-wide text-muted/70">技能详情</p>
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="h-6 min-w-[22px] rounded border border-white/10 px-1 text-[10px] leading-none text-muted transition-colors hover:text-paper"
              title="收起"
            >
              ×
            </button>
          </div>

          {/* 名称输入 */}
          <input
            className="mb-2.5 w-full rounded-lg border border-white/10 bg-[#1B2A4A]/60 px-3 py-2 text-[13px] leading-6 text-paper outline-none transition-colors duration-200 placeholder:text-muted/50 focus:border-aurora/60"
            aria-label="技能名称"
            placeholder={labels.skillsAddPlaceholder}
            value={activeSkill.name}
            onChange={(event) => handleSkillChange(activeSkill.id, { name: event.target.value })}
          />

          {/* 介绍输入 */}
          <textarea
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-[#1B2A4A]/60 px-3 py-2 text-[13px] leading-6 text-paper outline-none transition-colors duration-200 placeholder:text-muted/50 focus:border-aurora/60"
            aria-label="技能介绍"
            placeholder={labels.skillsDescPlaceholder}
            value={activeSkill.description ?? ''}
            onChange={(event) =>
              handleSkillChange(activeSkill.id, { description: event.target.value })
            }
          />

          <p className="mt-2 text-[10px] text-muted/50">
            修改会自动保存，刷新后保留。右键胶囊可直接删除。
          </p>
        </div>
      )}

      {/* 添加新技能按钮 */}
      <button
        type="button"
        onClick={handleAddSkill}
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
        {labels.skillsAdd}
      </button>

      {/* 右键删除确认浮层（就地弹出，z 高） */}
      {pendingDeleteId && (() => {
        const target = skills.find((s) => s.id === pendingDeleteId)
        if (!target) return null
        return (
          <div
            className="fixed left-1/2 top-1/2 z-[60] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-ember/40 bg-ink/98 px-5 py-4 text-paper shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-[12px] leading-relaxed text-paper/90">
              {labels.skillsDeleteConfirm}
            </p>
            <p className="mb-3 truncate text-[11px] text-muted/80">
              「{target.name || '未命名'}」
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-md border border-white/10 px-3 py-1 text-[11px] text-muted transition-colors hover:text-paper"
              >
                {labels.skillsDeleteCancelBtn}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-md border border-ember/60 bg-ember/10 px-3 py-1 text-[11px] text-ember transition-colors hover:bg-ember/20"
              >
                {labels.skillsDeleteConfirmBtn}
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
