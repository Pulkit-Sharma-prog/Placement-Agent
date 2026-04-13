import { useEffect, useState } from 'react'
import axios from 'axios'

function SkillTag({ skill }) {
  return (
    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-100">
      {skill}
    </span>
  )
}

function DomainTag({ tag }) {
  return (
    <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-100">
      {tag}
    </span>
  )
}

function ScoreBar({ score }) {
  const color =
    score >= 80 ? 'bg-emerald-500' :
    score >= 50 ? 'bg-amber-500' :
                  'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-slate-500 font-medium w-8">{score}%</span>
    </div>
  )
}

function StudentCard({ student, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {student.name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{student.name}</h3>
            <p className="text-xs text-slate-400">{student.email || 'No email'}</p>
          </div>
        </div>
        <ScoreBar score={student.profile_score || 0} />
      </div>

      {student.expertise_title && student.expertise_title !== 'Not Profiled' && (
        <p className="text-xs font-semibold text-indigo-600 mb-2">{student.expertise_title}</p>
      )}

      {student.domain_tags && student.domain_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {student.domain_tags.slice(0, 3).map(tag => <DomainTag key={tag} tag={tag} />)}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {student.skills.slice(0, 5).map(s => <SkillTag key={s} skill={s} />)}
        {student.skills.length > 5 && (
          <span className="text-xs text-slate-400 self-center">+{student.skills.length - 5}</span>
        )}
        {student.skills.length === 0 && (
          <span className="text-xs text-slate-400 italic">No skills</span>
        )}
      </div>
    </div>
  )
}

/* ── Detail Modal ──────────────────────────────────────────────────────────── */

function StudentDetail({ studentId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/students/${studentId}`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [studentId])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold border-2 border-white/30">
                {data.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{data.name}</h2>
                <p className="text-indigo-200 text-sm">{data.expertise_title}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-slate-700 font-medium">{data.email || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Phone</p>
              <p className="text-slate-700 font-medium">{data.phone || '—'}</p>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
            <span className="text-sm text-slate-500">Profile Score</span>
            <ScoreBar score={data.profile_score || 0} />
          </div>

          {/* Expertise Description */}
          {data.expertise_description && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Expertise Summary</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">{data.expertise_description}</p>
            </div>
          )}

          {/* Domain Tags */}
          {data.domain_tags && data.domain_tags.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Expert Fields</p>
              <div className="flex flex-wrap gap-2">
                {data.domain_tags.map(t => <DomainTag key={t} tag={t} />)}
              </div>
            </div>
          )}

          {/* Skills */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map(s => <SkillTag key={s} skill={s} />)}
              {data.skills.length === 0 && <span className="text-xs text-slate-400">None</span>}
            </div>
          </div>

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Education</p>
              <div className="space-y-2">
                {data.education.map((edu, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-slate-700">{edu.degree || '—'}</p>
                    {edu.institution && <p className="text-slate-500 text-xs">{edu.institution}</p>}
                    <div className="flex gap-3 mt-1">
                      {edu.year && <span className="text-xs text-indigo-600">{edu.year}</span>}
                      {edu.cgpa && <span className="text-xs text-slate-400">CGPA: {edu.cgpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Work Experience</p>
              <div className="space-y-2">
                {data.experience.map((exp, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 text-sm border-l-2 border-indigo-400">
                    <p className="font-semibold text-slate-700">{exp.role || '—'}</p>
                    {exp.company && <p className="text-slate-500 text-xs">{exp.company}</p>}
                    {exp.duration && <p className="text-xs text-slate-400 mt-1">{exp.duration}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Work Experience</p>
              <p className="text-xs text-slate-400 italic">No work experience detected</p>
            </div>
          )}

          {/* Key Responsibilities */}
          {data.key_responsibilities && data.key_responsibilities.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Responsibilities</p>
              <ul className="space-y-1">
                {data.key_responsibilities.map((r, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                    <span className="text-indigo-400">▸</span><span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Projects</p>
              <div className="space-y-2">
                {data.projects.map((p, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 text-xs">
                    <p className="font-semibold text-slate-700">{p.name}</p>
                    {p.tech && <p className="text-purple-600 mt-0.5">{p.tech}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Certifications</p>
              <ul className="space-y-1">
                {data.certifications.map((c, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                    <span className="text-amber-400">✦</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements */}
          {data.achievements && data.achievements.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Achievements</p>
              <ul className="space-y-1">
                {data.achievements.map((a, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                    <span className="text-yellow-400">★</span><span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Research Papers */}
          {data.research_papers && data.research_papers.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Research Papers</p>
              <div className="space-y-2">
                {data.research_papers.map((p, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 text-xs">
                    <p className="font-medium text-slate-700">{p.title}</p>
                    {p.venue && <p className="text-indigo-600 mt-0.5">{p.venue}</p>}
                    {p.year  && <p className="text-slate-400">{p.year}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patents */}
          {data.patents && data.patents.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Patents</p>
              <div className="space-y-2">
                {data.patents.map((p, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 text-xs">
                    <p className="font-medium text-slate-700">{p.title}</p>
                    {p.status && <p className="text-emerald-600 font-medium">{p.status}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {data.languages.map(l => (
                  <span key={l} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    axios.get('/api/students')
      .then(res => setStudents(res.data))
      .catch(() => setError('Could not reach the API. Is the FastAPI server running?'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    s.skills.some(sk => sk.includes(search.toLowerCase())) ||
    (s.expertise_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.domain_tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-slate-800">Students</h1>
        {!loading && (
          <span className="text-sm text-slate-400">{students.length} total</span>
        )}
      </div>
      <p className="text-slate-500 mb-6">Click any card to view the full profile.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Search by name, email, skill, or domain..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm mb-5 outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
      />

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400">
            {students.length === 0
              ? 'No students yet. Upload a resume to get started.'
              : 'No results match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <StudentCard key={s.id} student={s} onClick={() => setSelectedId(s.id)} />
          ))}
        </div>
      )}

      {selectedId && (
        <StudentDetail studentId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
