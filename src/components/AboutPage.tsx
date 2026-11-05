import { useEffect } from 'react'
import type { ContactInfo, PersonalInfo, SiteLabels } from '../config'

interface AboutPageProps {
  personal: PersonalInfo
  contact: ContactInfo
  labels: SiteLabels
}

/**
 * 个人介绍独立页面（由中心图案点击后在新标签页打开：/#/about）
 * 用和右上角按钮一致的圆角描边列表逐条展示信息，排版宽松
 */
export default function AboutPage({ personal, contact, labels }: AboutPageProps) {
  useEffect(() => {
    document.title = `${personal.name} · 个人介绍`
  }, [personal.name])

  const infoRows = [
    { label: labels.fieldName, value: personal.name },
    { label: labels.fieldSchool, value: personal.school },
    { label: labels.fieldMajor, value: personal.major },
    { label: labels.fieldClassName, value: personal.className },
    { label: labels.fieldStudentId, value: personal.studentId },
    { label: labels.fieldEmail, value: personal.email },
  ]

  const bio = personal.introduction.filter(Boolean).join(' ')

  return (
    <div className="page-aurora min-h-[100svh] w-full">
      <div className="mx-auto w-full max-w-[680px] px-6 py-16 sm:px-8 sm:py-24">
        {/* 顶部标识 */}
        <p className="flex items-center gap-3 text-[11px] tracking-[0.28em] text-muted/80">
          <span className="h-px w-8 bg-ember/60" />
          {labels.heroEyebrow}
        </p>

        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-paper sm:text-5xl">
          {personal.name}
        </h1>
        {personal.nameEn && (
          <p className="mt-3 text-sm tracking-[0.24em] text-muted/80 uppercase">
            {personal.nameEn}
          </p>
        )}

        {/* 列表式信息：与右上角"技能标签 / 保持联系"按钮同一套视觉 */}
        <ul className="mt-12 space-y-3">
          {infoRows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-[#1B2A4A]/50 px-5 py-4 backdrop-blur-sm transition-colors duration-200 hover:border-lilac/40"
            >
              <span className="shrink-0 text-[11px] tracking-[0.18em] text-muted">
                {row.label}
              </span>
              <span className="break-all text-right text-[14px] text-paper/90">{row.value}</span>
            </li>
          ))}

          {/* 个人简介单独占一行，允许换行 */}
          <li className="rounded-2xl border border-white/10 bg-[#1B2A4A]/50 px-5 py-4 backdrop-blur-sm transition-colors duration-200 hover:border-ember/40">
            <p className="text-[11px] tracking-[0.18em] text-muted">{labels.fieldBio}</p>
            <p
              className="mt-2 text-[14px] leading-8"
              style={{ color: personal.introductionColor ?? '#F5F1E8', opacity: 0.85 }}
            >
              {bio}
            </p>
          </li>
        </ul>

        {/* 底部：返回与版权 */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs tracking-wide text-muted transition-colors duration-200 hover:border-ember/50 hover:text-ember"
          >
            <span aria-hidden="true">←</span>
            {labels.backToPortfolio}
          </a>
          <p className="text-[11px] tracking-wide text-muted/60">{contact.copyright}</p>
        </div>
      </div>
    </div>
  )
}
