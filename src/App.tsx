import { useCallback, useEffect, useState } from 'react'
import type { ContactInfo, PersonalInfo, Project, SkillItem, TimeGroup } from './config'
import siteConfig from './config'
import ProjectsSection from './components/ProjectsSection'
import SidePanel from './components/SidePanel'
import SkillsPanel from './components/SkillsPanel'
import InterestsPanel from './components/InterestsPanel'
import ContactPanel from './components/ContactPanel'
import EditPanel from './components/EditPanel'
import AboutPage from './components/AboutPage'
import StarField from './components/StarField'

/** 右侧浮层的内容 */
type PanelKey = 'skills' | 'interests' | 'contact' | 'edit'

/** 可编辑内容的本地存储 key */
const STORAGE_KEY = 'portfolio-edit-v1'

/** 可编辑的内容范围 */
interface EditableContent {
  personal: PersonalInfo
  projects: Project[]
  skills: SkillItem[]
  /** 兴趣特长介绍（一整段文字） */
  interests: string
  contact: ContactInfo
  /** 时间分组 */
  groups: TimeGroup[]
}

/** 读取本地保存的编辑内容（没有或解析失败就返回 null） */
function loadSavedContent(): EditableContent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<EditableContent>
    if (!parsed.personal || !Array.isArray(parsed.projects)) return null
    // 兼容：老版本 localStorage 里没有 skills / interests / contact 字段 → 用默认值补齐
    const skills = Array.isArray(parsed.skills)
      ? (parsed.skills as SkillItem[])
      : siteConfig.skills
    // interests 早期版本是数组，现在是一段文字：类型不符时回退默认
    const interests = typeof parsed.interests === 'string' ? parsed.interests : siteConfig.interests
    const contact = parsed.contact ?? siteConfig.contact
    const groups = Array.isArray(parsed.groups)
      ? (parsed.groups as TimeGroup[])
      : siteConfig.groups
    return {
      personal: parsed.personal,
      projects: parsed.projects,
      skills,
      interests,
      contact,
      groups,
    }
  } catch {
    return null
  }
}

/** 在当前标签页以外新开标签，打开项目的在线地址 */
function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * 全屏成长星系页面
 * - 默认状态：温暖深空背景 + 星尘 + 中心图案 + 渐变轨道时间轴 + 星球节点，页面本身不滚动
 * - 中心图案 → 新标签打开个人介绍页（/#/about）
 * - 项目节点 / 窄屏卡片 → 新标签直接打开项目在线网站
 * - "技能标签 / 保持联系 / 编辑内容" 都是右侧滑出浮层，覆盖画布、不撑高页面
 */
export default function App() {
  const { personal, projects, milestones, skills, interests, contact: defaultContact, labels } = siteConfig

  const [activePanel, setActivePanel] = useState<PanelKey | null>(null)
  const [hash, setHash] = useState(() => window.location.hash)
  const [editable, setEditable] = useState<EditableContent>(
    () =>
      loadSavedContent() ?? {
        personal,
        projects,
        skills,
        interests,
        contact: defaultContact,
        groups: siteConfig.groups,
      },
  )

  // 极简 hash 路由：只用来识别个人介绍页，不引入路由库
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const closePanel = useCallback(() => setActivePanel(null), [])
  const openProject = useCallback((project: Project) => openInNewTab(project.url), [])

  /** 保存编辑内容（来自 EditPanel）：合并 personal / projects / groups，保留 skills + contact 不动 */
  const saveEditable = useCallback(
    (next: {
      personal: PersonalInfo
      projects: Project[]
      groups?: TimeGroup[]
      skills?: SkillItem[]
      contact?: ContactInfo
    }) => {
      const merged: EditableContent = {
        personal: next.personal,
        projects: next.projects,
        groups: next.groups ?? editable.groups,
        skills: next.skills ?? editable.skills,
        interests: editable.interests,
        contact: next.contact ?? editable.contact,
      }
      setEditable(merged)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // 隐私模式下忽略
      }
      setActivePanel(null)
    },
    [editable.groups, editable.skills, editable.interests, editable.contact],
  )

  /** 恢复 config.ts 的默认内容 */
  const resetEditable = useCallback(() => {
    setEditable({
      personal,
      projects,
      skills,
      interests,
      contact: defaultContact,
      groups: siteConfig.groups,
    })
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 忽略存储失败
    }
    setActivePanel(null)
  }, [personal, projects, skills, interests, defaultContact])

  /** 统一持久化 helper：传入 partial EditableContent，合并到 state + 写入 localStorage */
  const persistEditable = useCallback((updater: (prev: EditableContent) => EditableContent) => {
    setEditable((prev) => {
      const next = updater(prev)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // 隐私模式下忽略
      }
      return next
    })
  }, [])

  /** 从轨道上删除一个项目（右键星球节点触发） */
  const deleteProject = useCallback(
    (target: Project) => {
      persistEditable((prev) => ({
        ...prev,
        projects: prev.projects.filter((item) => item.id !== target.id),
      }))
    },
    [persistEditable],
  )

  /** 技能 CRUD */
  const updateSkills = useCallback(
    (next: SkillItem[]) => {
      persistEditable((prev) => ({ ...prev, skills: next }))
    },
    [persistEditable],
  )

  /** 兴趣介绍编辑（一整段文字） */
  const updateInterests = useCallback(
    (next: string) => {
      persistEditable((prev) => ({ ...prev, interests: next }))
    },
    [persistEditable],
  )

  /** 联系项 CRUD */
  const updateContact = useCallback(
    (next: ContactInfo) => {
      persistEditable((prev) => ({ ...prev, contact: next }))
    },
    [persistEditable],
  )

  if (hash === '#/about') {
    return <AboutPage personal={editable.personal} contact={editable.contact} labels={labels} />
  }

  const navItems = [
    { key: 'skills' as const, label: labels.skillsTitle },
    { key: 'interests' as const, label: labels.interestTitle },
    { key: 'contact' as const, label: labels.contactTitle },
  ]

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-ink">
      {/* 温暖深空背景：蓝紫 → 暖橙暮光，叠加柔和星云光斑 */}
      <div className="page-aurora pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* 星尘层：细小白色 / 暖橙光点与少量四角星 */}
      <StarField />

      {/* 全屏成长轨道画布 */}
      <ProjectsSection
        projects={editable.projects}
        groups={editable.groups}
        milestones={milestones}
        centerName={editable.personal.name}
        onOpenProject={openProject}
        onRequestDelete={deleteProject}
        timelineNote={labels.timelineNote}
        centerAria={labels.centerAria}
        centerHint={labels.centerHint}
      />

      {/* 右上角：小巧导航按钮 */}
      <nav className="absolute right-0 top-0 z-20 flex flex-row gap-2 p-5 sm:flex-col sm:items-end sm:p-8">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActivePanel(item.key)}
            className="rounded-full border border-white/10 bg-ink/50 px-3.5 py-1.5 text-[11px] tracking-wide text-muted backdrop-blur-sm transition-colors duration-200 hover:border-ember/50 hover:text-ember sm:px-4 sm:py-2 sm:text-xs"
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* 左下角：版权 */}
      <p className="pointer-events-none absolute bottom-0 left-0 z-20 p-5 text-[10px] tracking-wide text-muted/60 sm:p-8">
        {editable.contact.copyright}
      </p>

      {/* 右下角：克制的编辑入口 */}
      <button
        type="button"
        onClick={() => setActivePanel('edit')}
        aria-label={labels.editAria}
        title={labels.editAria}
        className="absolute bottom-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-ink/30 text-muted/45 backdrop-blur-sm transition-colors duration-200 hover:border-ember/35 hover:text-ember/85 sm:bottom-8 sm:right-8"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M10.4 2.2l3.4 3.4-8.3 8.3-4 0.6 0.6-4z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M9 3.6l3.4 3.4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>

      {/* 右侧浮层：技能标签 */}
      <SidePanel
        open={activePanel === 'skills'}
        onClose={closePanel}
        eyebrow={labels.skillsEyebrow}
        title={labels.skillsTitle}
        note={labels.skillsNote}
      >
        <SkillsPanel skills={editable.skills} labels={labels} onUpdate={updateSkills} />
      </SidePanel>

      {/* 右侧浮层：兴趣特长 */}
      <SidePanel
        open={activePanel === 'interests'}
        onClose={closePanel}
        eyebrow={labels.interestEyebrow}
        title={labels.interestTitle}
        note={labels.interestNote}
      >
        <InterestsPanel interests={editable.interests} onUpdate={updateInterests} />
      </SidePanel>

      {/* 右侧浮层：保持联系 */}
      <SidePanel
        open={activePanel === 'contact'}
        onClose={closePanel}
        eyebrow={labels.contactEyebrow}
        title={labels.contactTitle}
        note={labels.contactNote}
      >
        <ContactPanel contact={editable.contact} labels={labels} onUpdate={updateContact} />
      </SidePanel>

      {/* 右侧浮层：编辑内容 */}
      <SidePanel
        open={activePanel === 'edit'}
        onClose={closePanel}
        eyebrow={labels.editEyebrow}
        title={labels.editTitle}
        note={labels.editNote}
      >
        <EditPanel
          personal={editable.personal}
          projects={editable.projects}
          groups={editable.groups}
          labels={labels}
          onSave={saveEditable}
          onReset={resetEditable}
        />
      </SidePanel>
    </div>
  )
}
