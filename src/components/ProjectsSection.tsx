import type { Milestone, Project, TimeGroup } from '../config'
import SpiralCanvas from './SpiralCanvas'
import CenterCore from './CenterCore'
import { CENTER_LIFT_RATIO } from '../lib/spiral'

interface ProjectsSectionProps {
  projects: Project[]
  /** 时间分组（逻辑标签，同组星球光晕色调统一） */
  groups: TimeGroup[]
  /** 沿轨道标注的成长里程碑 */
  milestones: Milestone[]
  /** 中心圆圈里展示的姓名 */
  centerName: string
  /** 点击节点 / 卡片：直接在新标签页打开项目在线地址 */
  onOpenProject: (project: Project) => void
  /** 右键星球节点：弹出删除确认 */
  onRequestDelete?: (project: Project) => void
  /** 左键单击中心圆盘：打开个人介绍弹窗 */
  onOpenIntro: () => void
  /** 时间轴末端文案 */
  timelineNote: string
  /** 中心图案的无障碍说明 */
  centerAria: string
  /** 中心图案下方的小字提示 */
  centerHint: string
}

/**
 * 全屏项目画布
 * - 画布铺满整个视口，节点居中显示，不参与页面纵向排版
 * - 宽屏（≥640px）：中心图案 + 渐变成长时间轴螺旋，节点环绕中心一圈圈外扩
 * - 窄屏（<640px）：中心图案在上，下方是 3×3 项目网格
 */
export default function ProjectsSection({
  projects,
  groups,
  milestones,
  centerName,
  onOpenProject,
  onRequestDelete,
  onOpenIntro,
  timelineNote,
  centerAria,
  centerHint,
}: ProjectsSectionProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      {/* 宽屏：螺旋时间轴铺满可用画布，轨道随屏幕比例自适应为圆 / 横向椭圆 / 纵向椭圆 */}
      <div className="absolute inset-0 hidden sm:block">
        <SpiralCanvas
          projects={projects}
          groups={groups}
          milestones={milestones}
          onOpenProject={onOpenProject}
          onRequestDelete={onRequestDelete}
          note={timelineNote}
        />
        {/* 中心圆与螺旋系统共用同一上移比例，始终位于轨道几何中心 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${50 - CENTER_LIFT_RATIO * 100}%` }}
        >
          <CenterCore
            ariaLabel={centerAria}
            hint={centerHint}
            name={centerName}
            onOpen={onOpenIntro}
          />
        </div>
      </div>

      {/* 窄屏：中心图案 + 3 列网格 */}
      <div className="flex w-full flex-col items-center gap-7 sm:hidden">
        <CenterCore
          ariaLabel={centerAria}
          hint={centerHint}
          name={centerName}
          onOpen={onOpenIntro}
        />

        <div className="grid w-full max-w-[330px] grid-cols-3 gap-2.5">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpenProject(project)}
              aria-label={`打开项目：${project.name}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#2A3B66] to-[#18223F] text-left transition-colors duration-200 hover:border-lilac/60"
            >
              <img
                src={project.image}
                alt={project.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-200 group-hover:opacity-100"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#16233F] via-[#16233F]/55 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-2">
                <span className="block truncate text-[10.5px] leading-4 text-paper/90">
                  {project.name}
                </span>
                <span className="mt-0.5 block text-[9px] tracking-wider text-muted/80">
                  {project.time}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
