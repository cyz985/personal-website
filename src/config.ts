/* =============================================================================
 * config.ts —— 全站唯一的内容配置文件
 * -----------------------------------------------------------------------------
 * 你以后只需要修改本文件，就可以：
 *   1. 改个人信息（姓名 / 学校 / 班级 / 学号 / 邮箱 / 联系方式 / 专业背景 / 能力介绍）
 *   2. 增删项目（往 projects 数组里追加或删除对象即可，螺旋时间轴会自动排布）
 *   3. 改每个项目的时间标签 / 在线地址 / 简介 / 技术栈
 *   4. 增删技能标签（改 skills 数组）
 *   5. 改联系方式
 *   6. 改页面文案
 *
 * 注意：页面组件、螺旋算法、样式都无需改动。
 * ============================================================================= */

/** 个人信息 */
export interface PersonalInfo {
  /** 姓名 */
  name: string
  /** 姓名下方的英文/罗马字（可留空） */
  nameEn: string
  /** 学校 */
  school: string
  /** 班级 */
  className: string
  /** 学号 */
  studentId: string
  /** 邮箱 */
  email: string
  /** 联系方式（手机号 / 微信等） */
  phone: string
  /** 专业背景 */
  major: string
  /** 个人介绍段落：数组里每一项是一段，可自由增删 */
  introduction: string[]
  /** 个人简介文字颜色（十六进制，例如 "#F5F1E8"），不填时用默认暖白 */
  introductionColor?: string
  /** 能力特点：数组里每一项是短句，会以暖橙小圆点列表展示 */
  strengths: string[]
}

/** 单个项目 */
export interface Project {
  /** 唯一 id，用于 React key，不要重复 */
  id: string
  /** 项目名称（显示在星球卡片内部） */
  name: string
  /** 时间标签，例如 "2024.03"，沿轨道标注 */
  time: string
  /** 星球卡片内部的简短标签（2～5 个字） */
  tag: string
  /** 一句话简介（鼠标悬停节点时显示） */
  summary: string
  /** 项目预览图地址（移动端网格卡片使用，建议正方形图） */
  image: string
  /** 技术栈标签 */
  tech: string[]
  /**
   * 项目在线地址
   * 点击时间轴节点 / 移动端卡片会直接在新标签页打开这个地址
   */
  url: string
  /** 星球卡片里项目名称的文字颜色（十六进制，例如 "#F5F1E8"），不填时用默认暖白 */
  nameColor?: string
  /** 节点尺寸百分比（50~200，100 = 按默认"内小外大"规则自动计算），不填或填 100 都用默认 */
  sizePercent?: number
  /** 所属时间分组 id（可选），同组星球用统一光晕色调呼应 */
  groupId?: string
}

/** 时间分组（逻辑标签，不是容器；多个星球可绑定同一分组） */
export interface TimeGroup {
  /** 唯一 id */
  id: string
  /** 分组时间，例如 "2024.09" */
  time: string
  /** 分组名称 / 一句话说明，例如 "入门前端" */
  label: string
}

/** 分组光晕色板：柔和、不抢主视觉；每个新分组按顺序自动分配 */
export const GROUP_PALETTE = [
  '#FFB370', // 暖橙
  '#7FD8FF', // 极光浅蓝
  '#C7A6FF', // 淡紫
  '#8FD3B0', // 薄荷绿
  '#FF9AA8', // 樱粉
  '#F7E08C', // 暖金黄
] as const

/** 根据分组 id 或序号取色；未绑定时返回 null（星球保持原有圈层色） */
export function groupColorOf(
  group: TimeGroup | undefined,
  allGroups: TimeGroup[],
): { accent: string; glow: string } | null {
  if (!group) return null
  const idx = Math.max(0, allGroups.findIndex((g) => g.id === group.id))
  const accent = GROUP_PALETTE[idx % GROUP_PALETTE.length]
  return { accent, glow: hexToGlow(accent) }
}

/** 把十六进制色转成 rgba 柔光色 */
function hexToGlow(hex: string, alpha = 0.32): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** 成长时间轴上的里程碑（只画小圆点与时间文字，不参与项目排布） */
export interface Milestone {
  /** 唯一 id */
  id: string
  /** 时间文字，例如 "2024.09" / "未来" */
  time: string
  /** 一句话说明，例如 "入门前端" */
  label: string
}

/** 联系信息 */
export interface ContactInfo {
  email: string
  phone: string
  wechat: string
  location: string
  /** 版权行文案 */
  copyright: string
  /** 统一可编辑的联系项列表（如果存在，ContactPanel 完全以此为准） */
  items?: ContactItem[]
}

/** 单条联系项（可增删改） */
export interface ContactItem {
  /** 唯一 id，React key 用 */
  id: string
  /** 左侧标题，例如 "邮箱"、"微信"、"GitHub" */
  title: string
  /** 右侧内容，例如 email 地址、微信号、URL */
  value: string
}

/** 单个技能标签 */
export interface SkillItem {
  /** 唯一 id，React key 用 */
  id: string
  /** 技能名称（显示在胶囊上） */
  name: string
  /** 可选：技能介绍（点击标签弹出） */
  description?: string
}

/** 页面上的静态文案，同样集中在这里改 */
export interface SiteLabels {
  /** 页面英文小标识 */
  heroEyebrow: string
  /** 能力特点小标题 */
  heroStrengthsTitle: string
  /** 个人介绍页的返回链接文字 */
  backToPortfolio: string
  /** 个人信息展示字段的标签名 */
  fieldName: string
  fieldBio: string
  fieldSchool: string
  fieldClassName: string
  fieldStudentId: string
  fieldEmail: string
  fieldPhone: string
  fieldMajor: string
  fieldWechat: string
  fieldLocation: string
  /** 螺旋末端文案 */
  timelineNote: string
  /** 中心图案的无障碍说明 */
  centerAria: string
  /** 中心图案下方的小字提示 */
  centerHint: string
  skillsEyebrow: string
  skillsTitle: string
  skillsNote: string
  contactEyebrow: string
  contactTitle: string
  contactNote: string
  /** 兴趣特长面板 */
  interestEyebrow: string
  interestTitle: string
  interestNote: string
  /** 编辑入口 */
  editAria: string
  editEyebrow: string
  editTitle: string
  editNote: string
  editPersonalSection: string
  editProjectsSection: string
  editSave: string
  editReset: string
  /** 添加新项目按钮文字 */
  editAddProject: string
  /** 新增空项目卡片的默认占位名 */
  editNewProjectNamePlaceholder: string
  /** 节点大小调节标签 */
  editNodeSize: string
  /** 节点大小说明文字 */
  editNodeSizeHint: string
  /** 右键删除弹窗的确认文案 */
  editDeleteConfirm: string
  /** 右键删除弹窗的"确认删除"按钮 */
  editDeleteConfirmBtn: string
  /** 右键删除弹窗的"取消"按钮 */
  editDeleteCancelBtn: string
  /** 技能标签相关 */
  skillsAdd: string
  skillsAddPlaceholder: string
  skillsDeleteConfirm: string
  skillsDeleteConfirmBtn: string
  skillsDeleteCancelBtn: string
  skillsDescPlaceholder: string
  /** 联系项相关 */
  contactAdd: string
  contactAddTitle: string
  contactAddValue: string
  contactAddPlaceholderTitle: string
  contactAddPlaceholderValue: string
  contactDeleteConfirm: string
  contactDeleteConfirmBtn: string
  contactDeleteCancelBtn: string
  /** 时间分组相关 */
  groupsSection: string
  groupsAdd: string
  groupsTimeLabel: string
  groupsLabelLabel: string
  groupsDeleteConfirm: string
  groupsDeleteConfirmBtn: string
  groupsDeleteCancelBtn: string
  projectGroupLabel: string
  projectGroupNone: string
}

/** 全站配置总对象 */
export interface SiteConfig {
  personal: PersonalInfo
  projects: Project[]
  milestones: Milestone[]
  skills: SkillItem[]
  /** 兴趣特长介绍（一整段文字） */
  interests: string
  contact: ContactInfo
  /** 时间分组：逻辑标签，不是容器；多个星球可绑定同一分组 */
  groups: TimeGroup[]
  labels: SiteLabels
}

/* =============================================================================
 * 1. 个人信息（把下面的示例内容替换成你自己的）
 * ============================================================================= */
const personal: PersonalInfo = {
  name: '林知远',
  nameEn: 'Lin Zhiyuan',
  school: '示例大学 · 计算机学院',
  className: '软件工程 2401 班',
  studentId: '2024010101',
  email: 'linzhiyuan@example.com',
  phone: '138-0000-0000',
  major: '软件工程 / 前端与交互设计方向',
  introduction: ['我喜欢把代码变成有温度的界面。'],
  strengths: [
    'React / TypeScript 组件化开发',
    'Tailwind CSS 界面还原与响应式布局',
    'Figma 原型与视觉细节打磨',
    '数据整理与可视化表达',
    '课程项目的完整落地与部署',
  ],
}

/* =============================================================================
 * 2. 项目列表（数组顺序 = 成长时间顺序）
 * -----------------------------------------------------------------------------
 * ✅ 新增项目：直接往数组末尾追加一个对象即可。
 *    螺旋算法会自动把它放到轨道更外侧的位置，节点也会相应变大。
 * ✅ 时间标签：time 字段，会显示在节点下方，作为成长节点的时间标记。
 * ✅ 在线地址：url 字段，点击节点或移动端卡片会在新标签页直接打开它。
 *    把它换成你项目真实上线的地址即可。
 * ✅ 图片替换：image 字段（移动端网格卡片展示），支持在线 URL 或 /public 下的本地路径。
 * ============================================================================= */
const projects: Project[] = [
  {
    id: 'p1',
    name: '星轨 · 数据工作台',
    time: '2024.03',
    tag: '数据可视化',
    summary: '面向课程数据的可视化工作台，多维度图表联动。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20violet%20analytics%20dashboard%20on%20a%20widescreen%20monitor%20mockup%2C%20neon%20cyan%20line%20charts%20and%20glowing%20graphs%2C%20minimal%20high-end%20UI%20design%2C%20studio%20product%20shot%2C%204k&image_size=square_hd',
    tech: ['React', 'TypeScript', 'ECharts', 'Vite'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
  {
    id: 'p2',
    name: '拾光 · 校园二手',
    time: '2024.06',
    tag: '校园全栈',
    summary: '校园闲置物品交换平台，支持发布与筛选。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile%20app%20UI%20mockup%20for%20a%20campus%20second-hand%20marketplace%2C%20dark%20purple%20background%2C%20cyan%20accent%20buttons%2C%20clean%20product%20cards%2C%20soft%20studio%20lighting%2C%203d%20render&image_size=square_hd',
    tech: ['React', 'Tailwind CSS', 'Supabase', 'Vercel'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
  {
    id: 'p3',
    name: '墨迹 · 写作助手',
    time: '2024.09',
    tag: '交互写作',
    summary: '沉浸式写作界面，支持大纲整理与灵感记录。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimal%20writing%20app%20interface%20on%20a%20laptop%20screen%2C%20dark%20theme%2C%20cyan%20cursor%20glow%2C%20elegant%20typography%2C%20cinematic%20soft%20light%2C%20high%20detail&image_size=square_hd',
    tech: ['React', 'Zustand', 'TypeScript', 'IndexedDB'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
  {
    id: 'p4',
    name: '云端笔记',
    time: '2024.12',
    tag: '本地笔记',
    summary: '轻量卡片式笔记应用，支持标签检索。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=note%20taking%20app%20interface%20cards%20floating%20in%20space%2C%20dark%20purple%20gradient%2C%20thin%20cyan%20outlines%2C%20clean%20minimal%20composition%2C%20product%20render&image_size=square_hd',
    tech: ['React', 'LocalStorage', 'CSS Modules'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
  {
    id: 'p5',
    name: '城市漫步',
    time: '2025.03',
    tag: '地图可视化',
    summary: '城市路线探索小工具，可视化步行路线。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stylized%20city%20map%20interface%20on%20a%20tablet%2C%20dark%20purple%20palette%2C%20cyan%20route%20lines%2C%20isometric%20glow%2C%20modern%20app%20design&image_size=square_hd',
    tech: ['React', 'MapLibre', 'TypeScript'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
  {
    id: 'p6',
    name: '声律 · 播放器',
    time: '2025.06',
    tag: '音频交互',
    summary: '极简音乐播放器界面，带频谱可视化。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20player%20app%20UI%20with%20album%20artwork%2C%20dark%20violet%20theme%2C%20cyan%20waveform%2C%20glassmorphism%2C%20premium%20product%20render&image_size=square_hd',
    tech: ['React', 'Web Audio API', 'Tailwind CSS'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
  {
    id: 'p7',
    name: '简记账',
    time: '2025.09',
    tag: '数据统计',
    summary: '按周统计的极简记账应用。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimal%20finance%20tracker%20app%20UI%2C%20dark%20purple%20interface%2C%20cyan%20bar%20charts%2C%20clean%20cards%2C%20soft%20glow%2C%203d%20mockup&image_size=square_hd',
    tech: ['React', 'Chart.js', 'TypeScript'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
  {
    id: 'p8',
    name: '极简博客主题',
    time: '2025.12',
    tag: '前端模板',
    summary: '为课程作业写的极简博客模板。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimal%20blog%20website%20homepage%20on%20an%20iMac%20screen%2C%20dark%20purple%20background%2C%20cyan%20accent%20typography%2C%20lots%20of%20whitespace&image_size=square_hd',
    tech: ['Vite', 'React', 'Markdown', 'Tailwind CSS'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
  {
    id: 'p9',
    name: '像素天气',
    time: '2026.02',
    tag: '小组件',
    summary: '带极光背景的天气小组件。',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=weather%20app%20widget%20interface%2C%20dark%20violet%20aurora%20sky%2C%20cyan%20glow%2C%20frosted%20glass%20cards%2C%20minimal%20design%20render&image_size=square_hd',
    tech: ['React', 'OpenWeather API', 'Tailwind CSS'],
    url: 'https://example.com', // TODO：替换为项目真实在线地址
  },
]

/* =============================================================================
 * 3. 成长时间轴里程碑（沿轨道的小圆点 + 时间文字）
 * -----------------------------------------------------------------------------
 * 数量自由：数组里写几条，轨道上就会自动均匀分布几个里程碑。
 * 它们只做装饰与时间标注，不与项目节点冲突。
 * ============================================================================= */
const milestones: Milestone[] = [
  { id: 'm1', time: '2024.09', label: '入门前端' },
  { id: 'm2', time: '2024.12', label: '完成第一个项目' },
  { id: 'm3', time: '2025.03', label: '学习框架开发' },
  { id: 'm4', time: '2025.06', label: '独立完成应用' },
  { id: 'm5', time: '2025.09', label: '开始作品集整理' },
  { id: 'm6', time: '未来', label: '未完待续' },
]

/* =============================================================================
 * 3.5 时间分组（逻辑标签，不是容器；多个星球可绑定同一分组）
 * -----------------------------------------------------------------------------
 * 分组只用来让同时间段作品的星球光晕色调统一，不改变星球位置、不收纳星球。
 * 星球依然是独立个体，点击独立跳转项目链接。
 * ============================================================================= */
const groups: TimeGroup[] = [
  { id: 'g1', time: '2024.03', label: '数据与可视化起步' },
  { id: 'g2', time: '2024.06', label: '校园全栈初尝试' },
  { id: 'g3', time: '2024.09', label: '交互写作与沉浸式界面' },
  { id: 'g4', time: '2024.12', label: '轻量本地应用' },
  { id: 'g5', time: '2025.03', label: '地图与城市探索' },
  { id: 'g6', time: '2025.06', label: '音频与频谱交互' },
  { id: 'g7', time: '2025.09', label: '统计与模板打磨' },
  { id: 'g8', time: '2026.02', label: '小组件与极光背景' },
]

// 给每个项目绑上一个分组（不改项目顺序，只加 groupId 字段）
// 绑定规则：按时间相近匹配，让时间邻近的项目归属同一时间段
projects[0].groupId = 'g1' // 星轨 → 数据与可视化起步
projects[1].groupId = 'g2' // 拾光 → 校园全栈
projects[2].groupId = 'g3' // 墨迹 → 交互写作
projects[3].groupId = 'g4' // 云端 → 轻量本地应用
projects[4].groupId = 'g5' // 城市漫步 → 地图
projects[5].groupId = 'g6' // 声律 → 音频
projects[6].groupId = 'g7' // 简记账 → 统计
projects[7].groupId = 'g7' // 极简博客 → 模板打磨（同时间段）
projects[8].groupId = 'g8' // 像素天气 → 小组件

/* =============================================================================
 * 4. 技能标签（每项含 id / 名称 / 可选介绍）
 * ============================================================================= */
const skills: SkillItem[] = [
  { id: 's1', name: 'React', description: '组件化前端框架，Hooks 与状态管理。' },
  { id: 's2', name: 'TypeScript', description: '类型安全的 JavaScript 超集。' },
  { id: 's3', name: 'JavaScript ES6+', description: '现代语言特性，包括 async/await、Proxy、模块化。' },
  { id: 's4', name: 'Tailwind CSS', description: '原子化 CSS，快速搭建响应式界面。' },
  { id: 's5', name: 'HTML / CSS', description: '语义化结构与样式，Flex/Grid 布局。' },
  { id: 's6', name: 'Vite', description: '下一代前端构建工具。' },
  { id: 's7', name: 'Git / GitHub', description: '版本控制与协作工作流。' },
  { id: 's8', name: 'Figma', description: '界面设计与原型制作。' },
  { id: 's9', name: 'Node.js', description: '服务端 JavaScript，Express/Koa 框架。' },
  { id: 's10', name: '数据可视化', description: 'ECharts、D3、Canvas 绑图表。' },
  { id: 's11', name: '响应式布局', description: '移动端适配，断点与视口单位。' },
  { id: 's12', name: 'Vercel 部署', description: '静态站点与 Serverless 一键上线。' },
  { id: 's13', name: '组件化设计', description: '可复用 UI 组件抽象与 props 接口设计。' },
  { id: 's14', name: '基础交互设计', description: 'hover / 过渡 / 微交互的细节打磨。' },
]

/* =============================================================================
 * 5. 联系信息
 * ============================================================================= */
const contact: ContactInfo = {
  email: 'linzhiyuan@example.com',
  phone: '138-0000-0000',
  wechat: 'linzhiyuan_work',
  location: '中国 · 杭州',
  copyright: '© 2026 林知远 · 个人作品集',
  items: [
    { id: 'c1', title: '邮箱', value: 'linzhiyuan@example.com' },
    { id: 'c2', title: '微信', value: 'linzhiyuan_work' },
    { id: 'c3', title: '所在地', value: '中国 · 杭州' },
    { id: 'c4', title: '电话', value: '138-0000-0000' },
  ],
}

/* =============================================================================
 * 5.5 兴趣特长（一整段文字介绍，代码之外的生活）
 * ============================================================================= */
const interests = `代码之外，我喜欢背着相机在城市里散步，用镜头记录光线和街角的烟火气。周末常打羽毛球，也沉迷桌游和纪录片；天气好的时候会沿着江边骑行，或者在家手冲一杯咖啡，安静地看会儿书。这些爱好让我保持好奇心，也给了写代码之外的手感和节奏感。`

/* =============================================================================
 * 6. 页面静态文案（浮层标题、字段标签、时间轴末端文字）
 * ============================================================================= */
const labels: SiteLabels = {
  heroEyebrow: 'PORTFOLIO / 2026',
  heroStrengthsTitle: '能力特点',
  backToPortfolio: '返回作品集',
  fieldName: '姓名',
  fieldBio: '个人简介',
  fieldSchool: '学校',
  fieldClassName: '班级',
  fieldStudentId: '学号',
  fieldEmail: '邮箱',
  fieldPhone: '联系方式',
  fieldMajor: '专业',
  fieldWechat: '微信',
  fieldLocation: '所在地',
  timelineNote: '未完待续｜继续向更远的远方生长',
  centerAria: '打开个人介绍',
  centerHint: '点击查看我的介绍',
  skillsEyebrow: 'SKILLS',
  skillsTitle: '技能标签',
  skillsNote: '日常使用与正在学习的技术、工具。',
  contactEyebrow: 'CONTACT',
  contactTitle: '保持联系',
  contactNote: '欢迎交流课程项目、实习机会或任何有趣的想法。',
  interestEyebrow: 'INTERESTS',
  interestTitle: '兴趣特长',
  interestNote: '代码之外的生活，一些正在热爱的事情。',
  editAria: '编辑内容',
  editEyebrow: 'EDIT',
  editTitle: '编辑内容',
  editNote: '修改只保存在当前浏览器（localStorage），不会上传服务器；从 config.ts 也能改默认值。',
  editPersonalSection: '个人信息',
  editProjectsSection: '项目列表',
  editSave: '保存修改',
  editReset: '恢复默认',
  editAddProject: '＋ 添加新项目',
  editNewProjectNamePlaceholder: '新项目',
  editNodeSize: '节点大小',
  editNodeSizeHint: '50%–200%，留空或 100 表示按默认规则自动计算',
  editDeleteConfirm: '确定删除这个项目？轨道会自动重排，不可撤销。',
  editDeleteConfirmBtn: '删除',
  editDeleteCancelBtn: '取消',
  skillsAdd: '＋ 添加新技能',
  skillsAddPlaceholder: '新技能',
  skillsDeleteConfirm: '确定删除这个技能？',
  skillsDeleteConfirmBtn: '删除',
  skillsDeleteCancelBtn: '取消',
  skillsDescPlaceholder: '技能介绍（可选）',
  contactAdd: '＋ 添加联系项',
  contactAddTitle: '标题',
  contactAddValue: '内容',
  contactAddPlaceholderTitle: 'GitHub / 知乎 / 电话 …',
  contactAddPlaceholderValue: '对应的账号或链接',
  contactDeleteConfirm: '确定删除这条联系？',
  contactDeleteConfirmBtn: '删除',
  contactDeleteCancelBtn: '取消',
  groupsSection: '时间分组',
  groupsAdd: '＋ 新建分组',
  groupsTimeLabel: '分组时间',
  groupsLabelLabel: '分组名称',
  groupsDeleteConfirm: '删除分组只会清除星球上的这个标签，星球本身不会被删除。确定删除？',
  groupsDeleteConfirmBtn: '删除',
  groupsDeleteCancelBtn: '取消',
  projectGroupLabel: '所属分组',
  projectGroupNone: '未分组',
}

/* =============================================================================
 * 导出总配置
 * ============================================================================= */
const siteConfig: SiteConfig = {
  personal,
  projects,
  milestones,
  skills,
  interests,
  contact,
  groups,
  labels,
}

export default siteConfig
