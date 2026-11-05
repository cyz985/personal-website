import { useState } from 'react'
import siteConfig, {
  groupColorOf,
  type PersonalInfo,
  type Project,
  type SiteLabels,
  type SkillItem,
  type TimeGroup,
} from '../config'

/** 可编辑的内容范围：个人信息 + 项目列表 + 时间分组（skills 由 SkillsPanel 单独管理） */
export interface EditableContent {
  personal: PersonalInfo
  projects: Project[]
  groups?: TimeGroup[]
  skills?: SkillItem[]
}

interface EditPanelProps {
  personal: PersonalInfo
  projects: Project[]
  groups: TimeGroup[]
  labels: SiteLabels
  /** 点击保存：写入本地存储并关闭面板 */
  onSave: (next: EditableContent) => void
  /** 恢复 config.ts 里的默认内容 */
  onReset: () => void
}

const fieldClass =
  'w-full rounded-lg border border-white/10 bg-[#1B2A4A]/60 px-3 py-2 text-[13px] leading-6 text-paper outline-none transition-colors duration-200 placeholder:text-muted/50 focus:border-ember/60'
const labelClass = 'mb-1.5 block text-[11px] tracking-wide text-muted'
const sectionTitleClass = 'flex items-center gap-2 text-[10px] tracking-[0.24em] text-muted/80'

/** 允许在编辑面板里改的个人信息字段（其余字段保持 config.ts 原值） */
type PersonalField = 'name' | 'school' | 'major' | 'className' | 'studentId' | 'email'

/** 允许在编辑面板里改的项目字段 */
type ProjectField = 'name' | 'time' | 'summary' | 'url'

/** 默认色彩常量，清除颜色时回退到此 */
const DEFAULT_NAME_COLOR = '#F5F1E8'

/** 小巧的颜色选择器：方块 + 清除按钮，默认时显示占位 */
function ColorPicker({
  value,
  onChange,
  onClear,
}: {
  value?: string
  onChange: (color: string) => void
  onClear: () => void
}) {
  const current = value ?? DEFAULT_NAME_COLOR
  return (
    <div className="flex items-center gap-1.5">
      <label
        className="relative inline-block h-6 w-6 cursor-pointer overflow-hidden rounded border border-white/15 bg-white/[0.04]"
        title={value ? `当前颜色 ${value}，点击修改` : '点击设置自定义颜色'}
      >
        {/* 无颜色时显示一个斜杠占位 */}
        {!value && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-muted/60">
            /
          </span>
        )}
        <input
          type="color"
          value={current}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer border-0 bg-transparent p-0 opacity-0"
        />
        {/* 可见的颜色预览层：color 选择器本身在不同浏览器外观不一致 */}
        <span
          aria-hidden="true"
          className="absolute inset-1 rounded-[3px]"
          style={{ background: current, opacity: value ? 1 : 0.55 }}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={onClear}
          title="清除自定义颜色"
          className="h-6 min-w-[22px] rounded border border-white/10 px-1 text-[10px] leading-none text-muted transition-colors hover:text-paper"
        >
          ×
        </button>
      )}
    </div>
  )
}

/**
 * 编辑面板（前端本地编辑，不接后端）
 * - 修改的个人信息 / 项目字段保存到 localStorage，刷新后仍然生效
 * - "恢复默认"会回到 config.ts 里写死的内容
 */
export default function EditPanel({
  personal,
  projects,
  groups: initialGroups,
  labels,
  onSave,
  onReset,
}: EditPanelProps) {
  const [draftPersonal, setDraftPersonal] = useState<PersonalInfo>(personal)
  const [draftProjects, setDraftProjects] = useState<Project[]>(projects)
  const [draftGroups, setDraftGroups] = useState<TimeGroup[]>(initialGroups)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<TimeGroup | null>(null)

  const updatePersonal = (key: PersonalField, value: string) => {
    setDraftPersonal((prev) => ({ ...prev, [key]: value }))
  }

  const updateProject = (index: number, key: ProjectField, value: string) => {
    setDraftProjects((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    )
  }

  /**
   * 追加一条全新空白项目，和已有卡片结构完全一致：序号会自动变成下一个。
   * 螺旋轨道会在保存后自动重新排布，不需要手动调整。
   */
  const handleAddProject = () => {
    const nextIndex = draftProjects.length + 1
    const newProject: Project = {
      id: `new-${Date.now()}-${nextIndex}`,
      name: labels.editNewProjectNamePlaceholder,
      time: '',
      tag: '',
      summary: '',
      image:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20dark%20purple%20galaxy%20orb%20with%20soft%20glow%2C%20minimal%20clean%20background%2C%20portfolio%20placeholder%2C%20high%20detail&image_size=square_hd',
      tech: [],
      url: '',
    }
    setDraftProjects((prev) => [...prev, newProject])
  }

  const handleReset = () => {
    setDraftPersonal(siteConfig.personal)
    setDraftProjects(siteConfig.projects)
    setDraftGroups(siteConfig.groups)
    setConfirmDeleteGroup(null)
    onReset()
  }

  /** 新建分组 */
  const handleAddGroup = () => {
    const idx = draftGroups.length
    const newGroup: TimeGroup = {
      id: `g-${Date.now()}-${idx}`,
      time: '',
      label: '',
    }
    setDraftGroups((prev) => [...prev, newGroup])
  }

  /** 更新分组字段 */
  const updateGroup = (index: number, key: 'time' | 'label', value: string) => {
    setDraftGroups((prev) => prev.map((g, i) => (i === index ? { ...g, [key]: value } : g)))
  }

  /** 删除分组（同时清除星球上的这个 groupId 绑定） */
  const handleDeleteGroup = (target: TimeGroup) => {
    setDraftGroups((prev) => prev.filter((g) => g.id !== target.id))
    setDraftProjects((prev) =>
      prev.map((p) => (p.groupId === target.id ? { ...p, groupId: undefined } : p)),
    )
    setConfirmDeleteGroup(null)
  }

  /** 给某个星球设置所属分组（支持清除 = 传 undefined） */
  const bindProjectGroup = (projectId: string, groupId: string | undefined) => {
    setDraftProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, groupId: groupId || undefined } : p)),
    )
  }

  return (
    <div className="space-y-9">
      {/* 个人信息 */}
      <section>
        <h3 className={sectionTitleClass}>
          <span className="h-px w-5 bg-ember/60" />
          {labels.editPersonalSection}
        </h3>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className={labelClass} htmlFor="edit-name">
              {labels.fieldName}
            </label>
            <input
              id="edit-name"
              className={fieldClass}
              value={draftPersonal.name}
              onChange={(event) => updatePersonal('name', event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-school">
              {labels.fieldSchool}
            </label>
            <input
              id="edit-school"
              className={fieldClass}
              value={draftPersonal.school}
              onChange={(event) => updatePersonal('school', event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-major">
              {labels.fieldMajor}
            </label>
            <input
              id="edit-major"
              className={fieldClass}
              value={draftPersonal.major}
              onChange={(event) => updatePersonal('major', event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="edit-class">
                {labels.fieldClassName}
              </label>
              <input
                id="edit-class"
                className={fieldClass}
                value={draftPersonal.className}
                onChange={(event) => updatePersonal('className', event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="edit-student-id">
                {labels.fieldStudentId}
              </label>
              <input
                id="edit-student-id"
                className={fieldClass}
                value={draftPersonal.studentId}
                onChange={(event) => updatePersonal('studentId', event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-email">
              {labels.fieldEmail}
            </label>
            <input
              id="edit-email"
              className={fieldClass}
              value={draftPersonal.email}
              onChange={(event) => updatePersonal('email', event.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-bio">
              {labels.fieldBio}
            </label>
            <textarea
              id="edit-bio"
              rows={3}
              className={`${fieldClass} resize-none`}
              value={draftPersonal.introduction.join('\n\n')}
              onChange={(event) =>
                setDraftPersonal((prev) => ({
                  ...prev,
                  introduction: event.target.value.split(/\n\s*\n/),
                }))
              }
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10px] text-muted/60">个人简介文字颜色</p>
              <ColorPicker
                value={draftPersonal.introductionColor}
                onChange={(color) =>
                  setDraftPersonal((prev) => ({ ...prev, introductionColor: color }))
                }
                onClear={() =>
                  setDraftPersonal((prev) => ({ ...prev, introductionColor: undefined }))
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* 项目列表 */}
      <section>
        <h3 className={sectionTitleClass}>
          <span className="h-px w-5 bg-lilac/60" />
          {labels.editProjectsSection}
        </h3>

        <div className="mt-4 space-y-5">
          {draftProjects.map((project, index) => (
            <div
              key={project.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3.5"
            >
              <p className="text-[11px] tracking-wide text-muted/70">
                #{String(index + 1).padStart(2, '0')}
              </p>

              <div className="mt-2.5 space-y-2.5">
                <div className="grid grid-cols-[1fr_88px] gap-2.5">
                  <input
                    className={fieldClass}
                    aria-label="项目名称"
                    placeholder="项目名称"
                    value={project.name}
                    onChange={(event) => updateProject(index, 'name', event.target.value)}
                  />
                  <input
                    className={fieldClass}
                    aria-label="项目时间"
                    placeholder="2025.03"
                    value={project.time}
                    onChange={(event) => updateProject(index, 'time', event.target.value)}
                  />
                </div>

                <input
                  className={fieldClass}
                  aria-label="项目简介"
                  placeholder="一句话简介"
                  value={project.summary}
                  onChange={(event) => updateProject(index, 'summary', event.target.value)}
                />

                <input
                  className={fieldClass}
                  aria-label="项目链接"
                  placeholder="https://…"
                  value={project.url}
                  onChange={(event) => updateProject(index, 'url', event.target.value)}
                />

                <div className="flex items-center justify-between border-t border-white/[0.05] pt-2">
                  <p className="text-[10px] text-muted/60">星球节点名称颜色</p>
                  <ColorPicker
                    value={project.nameColor}
                    onChange={(color) =>
                      setDraftProjects((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, nameColor: color } : item)),
                      )
                    }
                    onClear={() =>
                      setDraftProjects((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, nameColor: undefined } : item,
                        ),
                      )
                    }
                  />
                </div>

                {/* 节点大小调节 */}
                <div className="border-t border-white/[0.05] pt-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[10px] text-muted/60">节点大小</p>
                    <span className="text-[10px] text-muted/50">
                      {project.sizePercent != null && project.sizePercent !== 100
                        ? `${project.sizePercent}%`
                        : '默认'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={5}
                      value={project.sizePercent ?? 100}
                      onChange={(event) => {
                        const v = Number(event.target.value)
                        setDraftProjects((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, sizePercent: v === 100 ? undefined : v }
                              : item,
                          ),
                        )
                      }}
                      className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-ember"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraftProjects((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, sizePercent: undefined } : item,
                          ),
                        )
                      }
                      title="恢复默认大小"
                      className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] leading-none text-muted transition-colors hover:text-paper"
                    >
                      重置
                    </button>
                  </div>
                  <p className="mt-1 text-[9px] leading-tight text-muted/40">
                    50%–200%，默认 100% 表示按轨道自动计算
                  </p>
                </div>

                {/* 所属分组：下拉选择，同组星球光晕色调会统一 */}
                <div className="border-t border-white/[0.05] pt-2">
                  <label className={labelClass}>{labels.projectGroupLabel}</label>
                  <select
                    className={fieldClass}
                    value={project.groupId ?? ''}
                    onChange={(event) => bindProjectGroup(project.id, event.target.value || undefined)}
                  >
                    <option value="">{labels.projectGroupNone}</option>
                    {draftGroups.map((g) => {
                      const c = groupColorOf(g, draftGroups)?.accent
                      return (
                        <option key={g.id} value={g.id}>
                          {g.time ? `${g.time} · ` : ''}
                          {g.label || '(未命名分组)'}
                          {c ? `  ●` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 添加新项目：新卡片会自动顺延到列表末尾，螺旋轨道保存后自动重排 */}
        <button
          type="button"
          onClick={handleAddProject}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3.5 py-3 text-[12px] tracking-wide text-muted transition-colors duration-200 hover:border-ember/40 hover:text-ember"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          {labels.editAddProject}
        </button>
      </section>

      {/* 时间分组：逻辑标签，不改变星球位置；同组星球光晕色调统一 */}
      <section>
        <h3 className={sectionTitleClass}>
          <span className="h-px w-5 bg-lilac/60" />
          {labels.groupsSection}
        </h3>

        <div className="mt-4 space-y-3">
          {draftGroups.map((group, index) => {
            const color = groupColorOf(group, draftGroups)?.accent
            return (
              <div
                key={group.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3"
              >
                <div className="flex items-center gap-2">
                  {/* 分组光晕色预览圆点 */}
                  <span
                    className="inline-block h-3 w-3 rounded-full ring-1 ring-white/20"
                    style={{
                      background: color ?? '#333',
                      boxShadow: color ? `0 0 6px ${color}` : 'none',
                    }}
                    aria-hidden="true"
                  />
                  <p className="text-[11px] tracking-wide text-muted/70">
                    #{String(index + 1).padStart(2, '0')}
                  </p>
                  {color && (
                    <span className="ml-auto text-[10px] text-muted/40" style={{ color }}>
                      {color}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 grid grid-cols-[100px_1fr] gap-2.5">
                  <input
                    className={fieldClass}
                    aria-label={labels.groupsTimeLabel}
                    placeholder="2024.09"
                    value={group.time}
                    onChange={(e) => updateGroup(index, 'time', e.target.value)}
                  />
                  <input
                    className={fieldClass}
                    aria-label={labels.groupsLabelLabel}
                    placeholder="分组说明，如「入门前端」"
                    value={group.label}
                    onChange={(e) => updateGroup(index, 'label', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteGroup(group)}
                  className="mt-2 text-[10px] text-muted/50 transition-colors hover:text-red-300/80"
                >
                  删除分组
                </button>
              </div>
            )
          })}

          {draftGroups.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-[11px] text-muted/45">
              暂无分组，点击下方按钮新建
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddGroup}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3.5 py-2.5 text-[12px] tracking-wide text-muted transition-colors duration-200 hover:border-lilac/40 hover:text-lilac"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          {labels.groupsAdd}
        </button>

        {/* 删除分组确认浮层 */}
        {confirmDeleteGroup && (
          <div className="mt-3 rounded-xl border border-red-300/25 bg-red-300/[0.04] px-4 py-3">
            <p className="text-[12px] leading-5 text-paper/85">{labels.groupsDeleteConfirm}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDeleteGroup(confirmDeleteGroup)}
                className="rounded-full border border-red-300/40 bg-red-300/10 px-4 py-1.5 text-[11px] tracking-wide text-red-200 transition-colors hover:bg-red-300/20"
              >
                {labels.groupsDeleteConfirmBtn}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteGroup(null)}
                className="rounded-full border border-white/10 px-4 py-1.5 text-[11px] tracking-wide text-muted transition-colors hover:text-paper"
              >
                {labels.groupsDeleteCancelBtn}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 底部操作 */}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-6">
        <button
          type="button"
          onClick={() => onSave({ personal: draftPersonal, projects: draftProjects, groups: draftGroups })}
          className="rounded-full border border-ember/40 bg-ember/10 px-5 py-2 text-xs tracking-wide text-ember transition-colors duration-200 hover:border-ember/70 hover:bg-ember/15"
        >
          {labels.editSave}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-white/10 px-5 py-2 text-xs tracking-wide text-muted transition-colors duration-200 hover:border-white/25 hover:text-paper"
        >
          {labels.editReset}
        </button>
      </div>
    </div>
  )
}
