import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Upload, CheckCircle, AlertCircle, Globe, Link2, ExternalLink,
  Phone, Mail, GraduationCap, Briefcase, FolderGit2, Award,
  Languages, TrendingUp, BookOpen, Lightbulb, FlaskConical, Users, Heart,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import SkillBadge from '../../components/ui/SkillBadge'
import SkillRadarChart from '../../components/charts/SkillRadarChart'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'

// ─── Colour palette per category ────────────────────────────────────────────
const CAT_COLORS = {
  'Programming Languages': { bg: 'rgba(108,99,255,0.12)', text: '#6C63FF', border: 'rgba(108,99,255,0.25)' },
  'Web Development':       { bg: 'rgba(62,207,207,0.12)', text: '#3ECFCF', border: 'rgba(62,207,207,0.25)' },
  'Mobile Development':    { bg: 'rgba(255,140,66,0.12)', text: '#FF8C42', border: 'rgba(255,140,66,0.25)' },
  'Databases':             { bg: 'rgba(255,107,157,0.12)', text: '#FF6B9D', border: 'rgba(255,107,157,0.25)' },
  'Cloud & DevOps':        { bg: 'rgba(255,200,55,0.12)', text: '#FFC837', border: 'rgba(255,200,55,0.25)' },
  'Data Science & AI':     { bg: 'rgba(108,99,255,0.15)', text: '#A78BFA', border: 'rgba(167,139,250,0.3)' },
  'Computer Science':      { bg: 'rgba(62,207,207,0.10)', text: '#5EEAD4', border: 'rgba(94,234,212,0.25)' },
  'Tools & Platforms':     { bg: 'rgba(255,140,66,0.10)', text: '#FDBA74', border: 'rgba(253,186,116,0.25)' },
  'Testing & QA':          { bg: 'rgba(134,239,172,0.12)', text: '#4ADE80', border: 'rgba(74,222,128,0.25)' },
  'Security':              { bg: 'rgba(248,113,113,0.12)', text: '#F87171', border: 'rgba(248,113,113,0.25)' },
  'Embedded & Hardware':   { bg: 'rgba(156,163,175,0.12)', text: '#9CA3AF', border: 'rgba(156,163,175,0.25)' },
  'Design':                { bg: 'rgba(244,114,182,0.12)', text: '#F472B6', border: 'rgba(244,114,182,0.25)' },
  'Methodologies':         { bg: 'rgba(96,165,250,0.12)', text: '#60A5FA', border: 'rgba(96,165,250,0.25)' },
  'Soft Skills':           { bg: 'rgba(251,191,36,0.12)', text: '#FBB824', border: 'rgba(251,191,36,0.25)' },
  'Domain Knowledge':      { bg: 'rgba(167,243,208,0.12)', text: '#6EE7B7', border: 'rgba(110,231,183,0.25)' },
  'Other':                 { bg: 'rgba(156,163,175,0.10)', text: '#9CA3AF', border: 'rgba(156,163,175,0.2)' },
}

function catStyle(category) {
  return CAT_COLORS[category] || CAT_COLORS['Other']
}

function Pill({ label, style: s }) {
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  )
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <h3
        className="font-semibold mb-4 flex items-center gap-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
      >
        {Icon && <Icon size={16} style={{ color: 'var(--purple)' }} />}
        {title}
      </h3>
      {children}
    </motion.div>
  )
}

export default function StudentProfile() {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn:  () => api.get('/students/me').then(r => r.data.data),
  })

  const student   = profileRes || null
  const profile   = student?.profile || null
  const hasResume = student?.has_resume && profile?.canonical_skills?.length > 0

  async function handleFile(file) {
    if (!file) return
    if (!file.name.match(/\.(pdf|docx)$/i)) {
      toast.error('Only PDF or DOCX files are accepted')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('resume', file)
    try {
      const { data } = await api.post('/students/me/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data.success) {
        toast.success(`Resume parsed! Found ${data.data.skills_found} skills.`)
        queryClient.invalidateQueries({ queryKey: ['my-profile'] })
        queryClient.invalidateQueries({ queryKey: ['my-matches'] })
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = e => handleFile(e.target.files[0])
  const onDrop = e => {
    e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0])
  }

  const parsed           = profile?.raw_parsed_data || {}
  const skillsByCategory = profile?.skills_by_category || {}
  const totalSkills      = profile?.canonical_skills?.length || 0

  return (
    <PageWrapper>
      <div className="space-y-5 max-w-3xl">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>My Profile</h1>

        {/* ── Upload card ─────────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Resume</h2>
            {hasResume && (
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#3ECFCF' }}>
                <CheckCircle size={14} /> Parsed & ready
              </span>
            )}
          </div>

          <label
            className="flex flex-col items-center justify-center w-full h-36 rounded-xl cursor-pointer transition-all"
            style={{
              border: `2px dashed ${dragOver ? 'var(--purple)' : 'var(--border-subtle)'}`,
              background: dragOver ? 'rgba(108,99,255,0.08)' : 'var(--bg-elevated)',
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input type="file" accept=".pdf,.docx" className="hidden" onChange={onInputChange} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Parsing your resume…
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>This may take 10–20 seconds</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={28} style={{ color: 'var(--purple)' }} />
                <span className="text-sm font-medium">
                  {hasResume ? 'Upload new resume to update profile' : 'Drop your resume here'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF or DOCX · Click or drag & drop</span>
              </div>
            )}
          </label>
        </div>

        {/* ── No resume yet ───────────────────────────────────────────── */}
        {!isLoading && !hasResume && !uploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 flex items-start gap-4"
          >
            <AlertCircle size={20} style={{ color: '#FF8C42', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-medium">No resume uploaded yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Upload your resume above. The AI will automatically extract all your skills, experience,
                projects, and certifications, then compute personalised job match scores.
              </p>
            </div>
          </motion.div>
        )}

        {isLoading && <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>}

        {/* ── Profile data ─────────────────────────────────────────────── */}
        {hasResume && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Header card */}
            <div className="glass-card p-6">
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--gradient-aurora)' }}
                >
                  {(student?.full_name || parsed?.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">
                    {student?.full_name || parsed?.name || '—'}
                  </h2>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    {(parsed?.email || student?.email) && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Mail size={11} /> {parsed?.email || student?.email}
                      </span>
                    )}
                    {parsed?.phone && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Phone size={11} /> {parsed.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {parsed?.linkedin && (
                      <a
                        href={parsed.linkedin.startsWith('http') ? parsed.linkedin : `https://${parsed.linkedin}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: '#60A5FA' }}
                      >
                        <Link2 size={11} /> LinkedIn
                      </a>
                    )}
                    {parsed?.github && (
                      <a
                        href={parsed.github.startsWith('http') ? parsed.github : `https://${parsed.github}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <ExternalLink size={11} /> GitHub
                      </a>
                    )}
                    {parsed?.portfolio && (
                      <a
                        href={parsed.portfolio}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: '#3ECFCF' }}
                      >
                        <Globe size={11} /> Portfolio
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-3xl font-bold aurora-text">{Math.round(profile?.profile_score || 0)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Profile Score</p>
                </div>
              </div>

              {parsed?.summary && (
                <p className="text-sm leading-relaxed mb-4 p-3 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {parsed.summary}
                </p>
              )}

              {/* Profile completeness bar */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Profile completeness
                  </span>
                  <span className="text-xs font-semibold aurora-text">
                    {Math.round(profile?.profile_score || 0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${profile?.profile_score || 0}%`, background: 'var(--gradient-aurora)' }}
                  />
                </div>
              </div>
            </div>

            {/* Skills by Category */}
            {Object.keys(skillsByCategory).length > 0 && (
              <SectionCard icon={TrendingUp} title={`Skills Detected · ${totalSkills} total`}>
                <div className="space-y-4">
                  {Object.entries(skillsByCategory).map(([cat, skills]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: catStyle(cat).text, opacity: 0.8 }}>
                        {cat} ({skills.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(s => (
                          <Pill key={s} label={s} style={catStyle(cat)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Skill Radar */}
            {profile?.skill_radar && Object.keys(profile.skill_radar).length > 0 && (
              <SectionCard title="Skill Radar">
                <SkillRadarChart radar={profile.skill_radar} />
              </SectionCard>
            )}

            {/* Skill gaps */}
            {profile?.skill_gaps?.length > 0 && (
              <SectionCard title="In-Demand Skills to Learn">
                <div className="flex flex-wrap gap-2">
                  {profile.skill_gaps.map(s => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: 'rgba(255,107,157,0.12)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.25)' }}
                    >
                      + {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  Adding these skills to your profile will significantly improve your match scores.
                </p>
              </SectionCard>
            )}

            {/* Education */}
            {parsed?.education?.length > 0 && (
              <SectionCard icon={GraduationCap} title="Education">
                <div className="space-y-3">
                  {parsed.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: 'var(--gradient-aurora)' }} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {edu.institution}
                        </p>
                        <div className="flex gap-3 mt-1">
                          {(edu.year_start || edu.year_end) && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {edu.year_start && edu.year_end ? `${edu.year_start} – ${edu.year_end}` : edu.year_end || edu.year_start}
                            </span>
                          )}
                          {edu.cgpa && (
                            <span className="text-xs font-semibold" style={{ color: '#3ECFCF' }}>
                              CGPA {edu.cgpa}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Experience */}
            {parsed?.experience?.length > 0 && (
              <SectionCard icon={Briefcase} title="Experience">
                <div className="space-y-4">
                  {parsed.experience.map((exp, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-sm">{exp.role || exp.company}</p>
                          {exp.role && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                              {exp.company}
                            </p>
                          )}
                        </div>
                        {(exp.start_date || exp.end_date) && (
                          <span className="text-xs flex-shrink-0 px-2 py-0.5 rounded-lg"
                            style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--purple)' }}>
                            {exp.start_date} – {exp.end_date || 'Present'}
                          </span>
                        )}
                      </div>

                      {exp.bullets?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {exp.bullets.map((b, j) => (
                            <li key={j} className="text-xs flex items-start gap-2"
                              style={{ color: 'var(--text-secondary)' }}>
                              <span className="mt-1 flex-shrink-0">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {exp.tech_used?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exp.tech_used.map(t => (
                            <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--purple)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Projects */}
            {parsed?.projects?.length > 0 && (
              <SectionCard icon={FolderGit2} title="Projects">
                <div className="space-y-4">
                  {parsed.projects.map((proj, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm">{proj.name}</p>
                        <div className="flex gap-2">
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
                              style={{ color: '#3ECFCF' }}>
                              <ExternalLink size={11} /> Live
                            </a>
                          )}
                        </div>
                      </div>

                      {proj.bullets?.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {proj.bullets.map((b, j) => (
                            <li key={j} className="text-xs flex items-start gap-2"
                              style={{ color: 'var(--text-secondary)' }}>
                              <span className="mt-1 flex-shrink-0">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {proj.tech_stack?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.tech_stack.map(t => (
                            <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(62,207,207,0.1)', color: '#3ECFCF' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Certifications */}
            {parsed?.certifications?.length > 0 && (
              <SectionCard icon={Award} title="Certifications">
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
              </SectionCard>
            )}

            {/* Achievements */}
            {parsed?.achievements?.length > 0 && (
              <SectionCard title="Achievements">
                <ul className="space-y-2">
                  {parsed.achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm"
                      style={{ color: 'var(--text-secondary)' }}>
                      <span className="mt-1">🏆</span> {a}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Publications / Research Papers */}
            {parsed?.publications?.length > 0 && (
              <SectionCard icon={BookOpen} title="Publications & Research Papers">
                <ul className="space-y-2">
                  {parsed.publications.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <BookOpen size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#60A5FA' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Patents */}
            {parsed?.patents?.length > 0 && (
              <SectionCard icon={Lightbulb} title="Patents">
                <ul className="space-y-2">
                  {parsed.patents.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Lightbulb size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#FDBA74' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Workshops / Seminars */}
            {parsed?.workshops?.length > 0 && (
              <SectionCard icon={FlaskConical} title="Workshops & Seminars">
                <ul className="space-y-2">
                  {parsed.workshops.map((w, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <FlaskConical size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#4ADE80' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{w}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Positions of Responsibility */}
            {parsed?.positions?.length > 0 && (
              <SectionCard icon={Users} title="Positions of Responsibility">
                <ul className="space-y-2">
                  {parsed.positions.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Users size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#F472B6' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Volunteer */}
            {parsed?.volunteer?.length > 0 && (
              <SectionCard icon={Heart} title="Volunteer & Community Service">
                <ul className="space-y-2">
                  {parsed.volunteer.map((v, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: 'var(--bg-elevated)' }}>
                      <Heart size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#F87171' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Languages */}
            {parsed?.languages?.length > 0 && (
              <SectionCard icon={Languages} title="Languages">
                <div className="flex flex-wrap gap-2">
                  {parsed.languages.map(l => (
                    <Pill key={l} label={l} style={catStyle('Methodologies')} />
                  ))}
                </div>
              </SectionCard>
            )}

            {profile?.last_parsed_at && (
              <p className="text-xs text-center pb-2" style={{ color: 'var(--text-muted)' }}>
                Last parsed: {new Date(profile.last_parsed_at).toLocaleString()}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
