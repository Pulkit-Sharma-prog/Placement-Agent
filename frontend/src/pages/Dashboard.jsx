import { useEffect, useState } from 'react'
import axios from 'axios'

function StatCard({ label, value, icon, color = 'bg-indigo-50 text-indigo-600' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  )
}

function DomainBadge({ tag, count }) {
  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
      <span className="text-sm text-slate-700 font-medium">{tag}</span>
      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  )
}

export default function Dashboard() {
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    axios.get('/api/students')
      .then(res => setStudents(res.data))
      .catch(() => setError('Could not reach the API. Is the FastAPI server running?'))
      .finally(() => setLoading(false))
  }, [])

  // Compute stats
  const avgScore = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.profile_score || 0), 0) / students.length)
    : 0

  // Count domain tags across all students
  const domainCounts = {}
  students.forEach(s => {
    (s.domain_tags || []).forEach(tag => {
      domainCounts[tag] = (domainCounts[tag] || 0) + 1
    })
  })
  const sortedDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  // Count all unique skills
  const allSkills = new Set()
  students.forEach(s => s.skills.forEach(sk => allSkills.add(sk)))

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-8">Overview of your placements pipeline.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading stats...</p>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Students"  value={students.length} icon="&#x1F9D1;&#x200D;&#x1F393;" color="bg-indigo-50 text-indigo-600" />
            <StatCard label="Avg Profile Score" value={`${avgScore}%`} icon="&#x1F4CA;" color="bg-emerald-50 text-emerald-600" />
            <StatCard label="Unique Skills"    value={allSkills.size} icon="&#x2699;&#xFE0F;" color="bg-purple-50 text-purple-600" />
            <StatCard label="Total Jobs"       value="--"            icon="&#x1F4BC;" color="bg-amber-50 text-amber-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Domain distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">Top Domains</h2>
              {sortedDomains.length === 0 ? (
                <p className="text-sm text-slate-400">No profiled students yet.</p>
              ) : (
                <div className="space-y-2">
                  {sortedDomains.map(([tag, count]) => (
                    <DomainBadge key={tag} tag={tag} count={count} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent uploads */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">Recent Uploads</h2>
              {students.length === 0 ? (
                <p className="text-slate-400 text-sm">No resumes uploaded yet. Go to <strong>Upload Resume</strong> to get started.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {students.slice(0, 5).map(s => (
                    <li key={s.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                          {s.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.expertise_title || s.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                        {s.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                            {skill}
                          </span>
                        ))}
                        {s.skills.length > 3 && (
                          <span className="text-xs text-slate-400">+{s.skills.length - 3}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
