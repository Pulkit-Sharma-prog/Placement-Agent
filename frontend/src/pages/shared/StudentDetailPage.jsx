/**
 * StudentDetailPage — full student profile view for Admin and Recruiter.
 * Route: /admin/students/:studentId  or  /recruiter/candidates/:studentId
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Mail, Phone, Link2, Globe,
  GraduationCap, Briefcase, FolderGit2, Award, BookOpen,
  FlaskConical, Lightbulb, Users, Heart, Languages,
  TrendingUp, ExternalLink, FileText, Download,
} from 'lucide-react'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import SkillBadge from '../../components/ui/SkillBadge'
import MatchScoreRing from '../../components/ui/MatchScoreRing'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import { useAuthStore } from '../../store/authStore'

// ── Colour palette (same as StudentProfile) ─────────────────────────────────
const CAT_COLORS = {
  'Programming Languages': { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF', border: 'rgba(10,132,255,0.25)' },
  'Web Development':       { bg: 'rgba(100,210,255,0.12)', text: '#64D2FF', border: 'rgba(100,210,255,0.25)' },
  'Mobile Development':    { bg: 'rgba(255,140,66,0.12)', text: '#FF9F0A', border: 'rgba(255,140,66,0.25)' },
  'Databases':             { bg: 'rgba(255,55,95,0.12)', text: '#FF375F', border: 'rgba(255,55,95,0.25)' },
  'Cloud & DevOps':        { bg: 'rgba(255,200,55,0.12)', text: '#FFC837', border: 'rgba(255,200,55,0.25)' },
  'Data Science & AI':     { bg: 'rgba(167,139,250,0.15)', text: '#A78BFA', border: 'rgba(167,139,250,0.3)' },
  'Computer Science':      { bg: 'rgba(94,234,212,0.10)', text: '#5EEAD4', border: 'rgba(94,234,212,0.25)' },
  'Tools & Platforms':     { bg: 'rgba(253,186,116,0.10)', text: '#FDBA74', border: 'rgba(253,186,116,0.25)' },
  'Testing & QA':          { bg: 'rgba(74,222,128,0.12)', text: '#32D74B', border: 'rgba(74,222,128,0.25)' },
  'Security':              { bg: 'rgba(248,113,113,0.12)', text: '#FF453A', border: 'rgba(248,113,113,0.25)' },
  'Embedded & Hardware':   { bg: 'rgba(156,163,175,0.12)', text: '#9CA3AF', border: 'rgba(156,163,175,0.25)' },
  'Design':                { bg: 'rgba(244,114,182,0.12)', text: '#F472B6', border: 'rgba(244,114,182,0.25)' },
  'Methodologies':         { bg: 'rgba(96,165,250,0.12)', text: '#60A5FA', border: 'rgba(96,165,250,0.25)' },
  'Soft Skills':           { bg: 'rgba(251,191,36,0.12)', text: '#FBB824', border: 'rgba(251,191,36,0.25)' },
  'Domain Knowledge':      { bg: 'rgba(110,231,183,0.12)', text: '#6EE7B7', border: 'rgba(110,231,183,0.25)' },
  'Other':                 { bg: 'rgba(156,163,175,0.10)', text: '#9CA3AF', border: 'rgba(156,163,175,0.2)' },
}

function catStyle(cat) { return CAT_COLORS[cat] || CAT_COLORS['Other'] }

function Pill({ label, style: s }) {
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  )
}

function Section({ icon: Icon, title, children, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <h3 className="font-semibold mb-4 flex items-center gap-2"
        style={{ fontFamily: 'var(--font-heading)' }}>
        {Icon && <Icon size={15} style={{ color: accent || 'var(--purple)' }} />}
        {title}
      </h3>
      {children}
    </motion.div>
  )
}

function InfoRow({ icon: Icon, children }) {
  if (!children) return null
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  )
}

export default function StudentDetailPage() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () => api.get(`/students/${studentId}`).then(r => r.data.data),
    enabled: !!studentId,
  })

  const backPath = isAdmin ? '/admin/students' : '/recruiter/candidates'

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="space-y-4 max-w-4xl">
          <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
        </div>
      </PageWrapper>
    )
  }

  if (isError || !data) {
    return (
      <PageWrapper>
        <div className="glass-card p-10 text-center max-w-xl mx-auto">
          <p className="text-lg font-semibold">Student not found</p>
          <button onClick={() => navigate(backPath)} className="mt-4 text-sm hover:underline"
            style={{ color: 'var(--purple)' }}>
            ← Go back
          </button>
        </div>
      </PageWrapper>
    )
  }

  const student        = data
  const profile        = student.profile || null
  const parsed         = profile?.raw_parsed_data || {}
  const skillsByCat    = profile?.skills_by_category || {}
  const hasResume      = student.has_resume

  return (
    <PageWrapper>
      <div className="space-y-5 max-w-4xl">
        {/* Back button */}
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={15} /> Back to students
        </button>

        {/* ── Header card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: 'var(--gradient-aurora)' }}>
              {(student.full_name || '?')[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                    {student.full_name || 'Unknown'}
                  </h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <InfoRow icon={Mail}>{student.email || parsed?.email}</InfoRow>
                    <InfoRow icon={Phone}>{parsed?.phone || student.phone}</InfoRow>
                    {parsed?.linkedin && (
                      <a href={parsed.linkedin.startsWith('http') ? parsed.linkedin : `https://${parsed.linkedin}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-80"
                        style={{ color: '#60A5FA' }}>
                        <Link2 size={11} /> LinkedIn <ExternalLink size={9} />
                      </a>
                    )}
                    {parsed?.github && (
                      <a href={parsed.github.startsWith('http') ? parsed.github : `https://${parsed.github}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-80"
                        style={{ color: 'var(--text-secondary)' }}>
                        <ExternalLink size={11} /> GitHub <ExternalLink size={9} />
                      </a>
                    )}
                    {parsed?.portfolio && (
                      <a href={parsed.portfolio} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-80"
                        style={{ color: '#64D2FF' }}>
                        <Globe size={11} /> Portfolio <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <MatchScoreRing score={student.profile_score || 0} size={56} strokeWidth={4} />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Profile Score</p>
                  </div>
                  <StatusBadge status={student.status} />
                </div>
              </div>

              {/* Academic row */}
              <div className="flex flex-wrap gap-3 mt-3">
                {student.branch && (
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--purple)', border: '1px solid rgba(10,132,255,0.2)' }}>
                    {student.branch}
                  </span>
                )}
                {student.cgpa && (
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(100,210,255,0.1)', color: '#64D2FF', border: '1px solid rgba(100,210,255,0.2)' }}>
                    CGPA {student.cgpa}
                  </span>
                )}
                {student.graduation_year && (
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,200,55,0.1)', color: '#FFC837', border: '1px solid rgba(255,200,55,0.2)' }}>
                    Class of {student.graduation_year}
                  </span>
                )}
                {student.roll_number && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-mono"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                    {student.roll_number}
                  </span>
                )}
                {!hasResume && (
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,55,95,0.1)', color: '#FF375F', border: '1px solid rgba(255,55,95,0.2)' }}>
                    No resume uploaded
                  </span>
                )}
              </div>

              {/* Resume download */}
              {hasResume && (
                <div className="mt-3">
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/students/${studentId}/resume/download`}
                    className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <Download size={12} /> Download Resume
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {parsed?.summary && (
            <p className="mt-4 text-sm leading-relaxed p-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              {parsed.summary}
            </p>
          )}
        </motion.div>

        {/* No data yet */}
        {!hasResume && (
          <div className="glass-card p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="font-medium">Resume not uploaded yet</p>
            <p className="text-sm mt-1 opacity-70">
              The student hasn't uploaded a resume. Skills, experience and other details will appear here once parsed.
            </p>
          </div>
        )}

        {hasResume && (
          <>
            {/* Skills by Category */}
            {Object.keys(skillsByCat).length > 0 && (
              <Section icon={TrendingUp} title={`Skills · ${profile?.canonical_skills?.length || 0} detected`}>
                <div className="space-y-4">
                  {Object.entries(skillsByCat).map(([cat, skills]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: catStyle(cat).text, opacity: 0.85 }}>
                        {cat} ({skills.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(s => <Pill key={s} label={s} style={catStyle(cat)} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Work Experience */}
            {parsed?.experience?.length > 0 && (
              <Section icon={Briefcase} title="Work Experience" accent="#FFC837">
                <div className="space-y-4">
                  {parsed.experience.map((exp, i) => (
                    <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-semibold">{exp.role || exp.company}</p>
                          {exp.role && (
                            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                              {exp.company}
                            </p>
                          )}
                        </div>
                        {(exp.start_date || exp.end_date) && (
                          <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                            style={{ background: 'rgba(255,200,55,0.1)', color: '#FFC837', border: '1px solid rgba(255,200,55,0.2)' }}>
                            {exp.start_date} – {exp.end_date || 'Present'}
                          </span>
                        )}
                      </div>

                      {exp.bullets?.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {exp.bullets.map((b, j) => (
                            <li key={j} className="text-sm flex items-start gap-2"
                              style={{ color: 'var(--text-secondary)' }}>
                              <span className="mt-1 opacity-50 flex-shrink-0">▸</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {exp.tech_used?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {exp.tech_used.map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded"
                              style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--purple)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Education */}
            {parsed?.education?.length > 0 && (
              <Section icon={GraduationCap} title="Education" accent="#64D2FF">
                <div className="space-y-3">
                  {parsed.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ background: 'var(--gradient-aurora)' }} />
                      <div>
                        <p className="font-medium">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {edu.institution}
                        </p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {(edu.year_start || edu.year_end) && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {edu.year_start && edu.year_end
                                ? `${edu.year_start} – ${edu.year_end}`
                                : edu.year_end || edu.year_start}
                            </span>
                          )}
                          {edu.cgpa && (
                            <span className="text-xs font-semibold" style={{ color: '#64D2FF' }}>
                              CGPA {edu.cgpa}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Projects */}
            {parsed?.projects?.length > 0 && (
              <Section icon={FolderGit2} title="Projects" accent="#A78BFA">
                <div className="space-y-4">
                  {parsed.projects.map((proj, i) => (
                    <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <p className="font-semibold">{proj.name}</p>
                        <div className="flex gap-3">
                          {proj.github_link && (
                            <a href={proj.github_link.startsWith('http') ? proj.github_link : `https://${proj.github_link}`}
                              target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs hover:opacity-80"
                              style={{ color: 'var(--text-muted)' }}>
                              <ExternalLink size={11} /> Code
                            </a>
                          )}
                          {proj.live_link && (
                            <a href={proj.live_link} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs hover:opacity-80"
                              style={{ color: '#64D2FF' }}>
                              <ExternalLink size={11} /> Live
                            </a>
                          )}
                        </div>
                      </div>
                      {proj.bullets?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {proj.bullets.map((b, j) => (
                            <li key={j} className="text-sm flex items-start gap-2"
                              style={{ color: 'var(--text-secondary)' }}>
                              <span className="mt-1 opacity-50 flex-shrink-0">▸</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {proj.tech_stack?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {proj.tech_stack.map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded"
                              style={{ background: 'rgba(100,210,255,0.1)', color: '#64D2FF' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Certifications */}
            {parsed?.certifications?.length > 0 && (
              <Section icon={Award} title="Certifications" accent="#FFC837">
                <div className="space-y-2">
                  {parsed.certifications.map((cert, i) => {
                    const c = typeof cert === 'string' ? { title: cert } : cert
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: 'var(--bg-elevated)' }}>
                        <Award size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#FFC837' }} />
                        <div>
                          <p className="text-sm font-medium">{c.title}</p>
                          {(c.issuer || c.year) && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {c.issuer}{c.issuer && c.year ? ' · ' : ''}{c.year}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            {/* Publications / Research Papers */}
            {parsed?.publications?.length > 0 && (
              <Section icon={BookOpen} title="Publications & Research Papers" accent="#60A5FA">
                <ul className="space-y-2">
                  {parsed.publications.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <BookOpen size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#60A5FA' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Patents */}
            {parsed?.patents?.length > 0 && (
              <Section icon={Lightbulb} title="Patents" accent="#FDBA74">
                <ul className="space-y-2">
                  {parsed.patents.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Lightbulb size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#FDBA74' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Workshops / Seminars */}
            {parsed?.workshops?.length > 0 && (
              <Section icon={FlaskConical} title="Workshops & Seminars" accent="#32D74B">
                <ul className="space-y-2">
                  {parsed.workshops.map((w, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <FlaskConical size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#32D74B' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{w}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Achievements */}
            {parsed?.achievements?.length > 0 && (
              <Section icon={Award} title="Achievements & Awards" accent="#FF375F">
                <ul className="space-y-2">
                  {parsed.achievements.map((a, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <span style={{ color: '#FF375F' }} className="flex-shrink-0">🏆</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{a}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Positions of Responsibility */}
            {parsed?.positions?.length > 0 && (
              <Section icon={Users} title="Positions of Responsibility" accent="#F472B6">
                <ul className="space-y-2">
                  {parsed.positions.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Users size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#F472B6' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Volunteer */}
            {parsed?.volunteer?.length > 0 && (
              <Section icon={Heart} title="Volunteer & Community Service" accent="#FF453A">
                <ul className="space-y-2">
                  {parsed.volunteer.map((v, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Heart size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#FF453A' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Languages */}
            {parsed?.languages?.length > 0 && (
              <Section icon={Languages} title="Languages">
                <div className="flex flex-wrap gap-2">
                  {parsed.languages.map(l => (
                    <Pill key={l} label={l} style={{ bg: 'rgba(96,165,250,0.12)', text: '#60A5FA', border: 'rgba(96,165,250,0.25)' }} />
                  ))}
                </div>
              </Section>
            )}

            {/* Skill Gaps (admin/recruiter insight) */}
            {profile?.skill_gaps?.length > 0 && (
              <Section title="Skill Gaps" icon={TrendingUp} accent="#FF375F">
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  High-demand skills this candidate hasn't listed yet:
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.skill_gaps.map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: 'rgba(255,55,95,0.1)', color: '#FF375F', border: '1px solid rgba(255,55,95,0.2)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* All raw skills fallback if no category grouping */}
            {Object.keys(skillsByCat).length === 0 && profile?.canonical_skills?.length > 0 && (
              <Section icon={TrendingUp} title={`Skills · ${profile.canonical_skills.length}`}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.canonical_skills.map(s => <SkillBadge key={s} skill={s} highlight />)}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
