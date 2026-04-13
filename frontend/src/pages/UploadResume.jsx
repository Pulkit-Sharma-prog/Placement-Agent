import { useState, useRef } from 'react'
import axios from 'axios'

/* ─── Reusable primitives ─────────────────────────────────────────────────── */

function SkillTag({ skill }) {
  return (
    <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-100">
      {skill}
    </span>
  )
}

function DomainTag({ tag }) {
  return (
    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
      {tag}
    </span>
  )
}

function ScoreBadge({ score }) {
  const color =
    score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-300' :
    score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-300' :
                  'text-red-600 bg-red-50 border-red-300'
  return (
    <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border ${color}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Profile {score}%
    </div>
  )
}

/* Section header with icon */
function SH({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
      <span className="text-base">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h3>
    </div>
  )
}

/* Empty state for missing fields */
function Empty({ label }) {
  return (
    <p className="text-sm text-slate-400 italic bg-slate-50 rounded-lg px-4 py-3 border border-dashed border-slate-200">
      {label}
    </p>
  )
}

/* ─── Individual Section Components ─────────────────────────────────────────  */

function ContactRow({ email, phone }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 font-medium">Email ID</p>
          <p className="text-sm text-slate-700 font-medium truncate">{email || 'Not found'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Contact Number</p>
          <p className="text-sm text-slate-700 font-medium">{phone || 'Not found'}</p>
        </div>
      </div>
    </div>
  )
}

function SkillsSection({ skills }) {
  return (
    <div>
      <SH icon="⚙️" title="Skills" />
      {skills.length > 0
        ? <div className="flex flex-wrap gap-2">{skills.map(s => <SkillTag key={s} skill={s} />)}</div>
        : <Empty label="No skills detected" />}
    </div>
  )
}

function LanguagesSection({ languages }) {
  return (
    <div>
      <SH icon="🌐" title="Languages" />
      {languages.length > 0
        ? <div className="flex flex-wrap gap-2">
            {languages.map(l => (
              <span key={l} className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
                {l}
              </span>
            ))}
          </div>
        : <Empty label="No languages detected" />}
    </div>
  )
}

function EducationSection({ education }) {
  return (
    <div>
      <SH icon="🎓" title="Educational Qualification" />
      {education.length > 0
        ? <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{edu.degree || 'Degree not specified'}</p>
                    {edu.institution && <p className="text-slate-500 text-sm mt-0.5">{edu.institution}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {edu.year && (
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {edu.year}
                      </span>
                    )}
                    {edu.cgpa && <p className="text-xs text-slate-400 mt-1">CGPA / Marks: {edu.cgpa}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        : <Empty label="No educational qualifications detected" />}
    </div>
  )
}

function ExperienceSection({ experience }) {
  return (
    <div>
      <SH icon="💼" title="Work Experience" />
      {experience.length > 0
        ? <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
                <div className="pl-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{exp.role || 'Role not specified'}</p>
                    {exp.duration && (
                      <span className="text-xs text-slate-400 flex-shrink-0">{exp.duration}</span>
                    )}
                  </div>
                  {exp.company && <p className="text-slate-500 text-sm mt-0.5">{exp.company}</p>}
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.responsibilities.map((r, j) => (
                        <li key={j} className="text-xs text-slate-600 flex gap-1.5">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        : <Empty label="No work experience detected" />}
    </div>
  )
}

function ResponsibilitiesSection({ responsibilities }) {
  return (
    <div>
      <SH icon="📋" title="Key Responsibilities Handled" />
      {responsibilities.length > 0
        ? <ul className="space-y-2">
            {responsibilities.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                <span className="text-indigo-400 font-bold flex-shrink-0">▸</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        : <Empty label="No key responsibilities detected" />}
    </div>
  )
}

function ProjectsSection({ projects }) {
  return (
    <div>
      <SH icon="🚀" title="Projects" />
      {projects.length > 0
        ? <div className="space-y-3">
            {projects.map((p, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                {p.tech && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tech.split(/[,|]/).map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {p.description && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.description}</p>}
              </div>
            ))}
          </div>
        : <Empty label="No projects detected" />}
    </div>
  )
}

function CertificationsSection({ certifications }) {
  return (
    <div>
      <SH icon="🏅" title="Certifications & Courses" />
      {certifications.length > 0
        ? <ul className="space-y-2">
            {certifications.map((c, i) => (
              <li key={i} className="flex gap-2.5 items-start text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                <span className="text-amber-400 flex-shrink-0">✦</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        : <Empty label="No certifications or courses detected" />}
    </div>
  )
}

function AchievementsSection({ achievements }) {
  return (
    <div>
      <SH icon="🏆" title="Achievements & Awards" />
      {achievements.length > 0
        ? <ul className="space-y-2">
            {achievements.map((a, i) => (
              <li key={i} className="flex gap-2.5 items-start text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                <span className="text-yellow-400 flex-shrink-0">★</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        : <Empty label="No achievements or awards detected" />}
    </div>
  )
}

function ResearchSection({ papers }) {
  return (
    <div>
      <SH icon="📄" title="Research Papers & Publications" />
      {papers.length > 0
        ? <div className="space-y-3">
            {papers.map((p, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="font-medium text-slate-800 text-sm">{p.title}</p>
                {p.venue && <p className="text-xs text-indigo-600 mt-1">{p.venue}</p>}
                {p.year  && <p className="text-xs text-slate-400 mt-0.5">{p.year}</p>}
              </div>
            ))}
          </div>
        : <Empty label="No research papers or publications detected" />}
    </div>
  )
}

function PatentsSection({ patents }) {
  return (
    <div>
      <SH icon="💡" title="Patents" />
      {patents.length > 0
        ? <div className="space-y-3">
            {patents.map((p, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="font-medium text-slate-800 text-sm">{p.title}</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {p.patent_no && <span className="text-xs text-slate-500">No: {p.patent_no}</span>}
                  {p.status    && <span className="text-xs text-emerald-600 font-medium">{p.status}</span>}
                  {p.year      && <span className="text-xs text-slate-400">{p.year}</span>}
                </div>
              </div>
            ))}
          </div>
        : <Empty label="No patents detected" />}
    </div>
  )
}

/* ─── Main Profile Card ──────────────────────────────────────────────────── */

function ProfileCard({ profile }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30 flex-shrink-0">
              {profile.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">{profile.name || 'Unknown'}</h2>
              <p className="text-indigo-200 text-sm font-medium mt-1">
                {profile.expertise_title || 'Software Professional'}
              </p>
              {profile.domain_tags && profile.domain_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.domain_tags.map(t => (
                    <span key={t} className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ScoreBadge score={profile.profile_score || 0} />
        </div>
      </div>

      {/* Expertise description */}
      {profile.expertise_description && (
        <div className="px-6 py-4 bg-indigo-50/50 border-b border-indigo-100">
          <p className="text-sm text-slate-700 leading-relaxed">{profile.expertise_description}</p>
        </div>
      )}

      {/* All sections */}
      <div className="p-6 space-y-7">
        <ContactRow email={profile.email} phone={profile.phone} />
        <SkillsSection skills={profile.skills || []} />
        <LanguagesSection languages={profile.languages || []} />
        <EducationSection education={profile.education || []} />
        <ExperienceSection experience={profile.experience || []} />
        <ResponsibilitiesSection responsibilities={profile.key_responsibilities || []} />
        <ProjectsSection projects={profile.projects || []} />
        <CertificationsSection certifications={profile.certifications || []} />
        <AchievementsSection achievements={profile.achievements || []} />
        <ResearchSection papers={profile.research_papers || []} />
        <PatentsSection patents={profile.patents || []} />
      </div>
    </div>
  )
}

/* ─── Upload Page ────────────────────────────────────────────────────────── */

export default function UploadResume() {
  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [profile, setProfile]   = useState(null)
  const [error, setError]       = useState('')
  const inputRef = useRef()

  function handleFile(f) {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are supported.')
      return
    }
    setError('')
    setProfile(null)
    setFile(f)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError('')
    setProfile(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post('/api/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed. Is the FastAPI server running?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-1">Upload Resume</h1>
      <p className="text-slate-500 mb-8">
        PDF or DOCX — we extract all fields including research papers, patents, certifications, and more.
      </p>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {file ? (
            <div>
              <p className="text-slate-700 font-semibold">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Ready to parse</p>
            </div>
          ) : (
            <>
              <p className="text-slate-600 font-semibold">Drag & drop your resume here</p>
              <p className="text-sm text-slate-400 mt-1">or click to browse — PDF / DOCX</p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {file && (
        <button onClick={handleUpload} disabled={loading}
          className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-300 disabled:to-purple-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Parsing & Profiling...
            </span>
          ) : 'Parse Resume'}
        </button>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm flex gap-2 items-center">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {profile && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500"/>
            <p className="text-sm text-emerald-600 font-semibold">Resume parsed & profiled successfully</p>
          </div>
          <ProfileCard profile={profile} />
        </div>
      )}
    </div>
  )
}
