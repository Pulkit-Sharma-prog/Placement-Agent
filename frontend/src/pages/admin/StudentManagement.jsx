import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, UserCheck, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import MatchScoreRing from '../../components/ui/MatchScoreRing'
import SkillBadge from '../../components/ui/SkillBadge'
import { SkeletonTable } from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'

export default function StudentManagement() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search, branchFilter],
    queryFn: () =>
      api.get(`/students?limit=50${search ? `&search=${search}` : ''}${branchFilter ? `&branch=${branchFilter}` : ''}`)
        .then(r => r.data.data)
        .catch(() => []),
  })

  const students = data || []
  const branches = ['CSE', 'IT', 'ECE', 'ME', 'EE', 'Civil']

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Student Management</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {students.length} students
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <Download size={15} /> Export
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or roll number..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {isLoading ? (
          <SkeletonTable rows={10} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No students found"
            subtitle="Try adjusting your search or filters"
          />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <tr>
                    {['Student', 'Roll No.', 'Branch', 'CGPA', 'Profile Score', 'Skills', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/admin/students/${s.id}`)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                            style={{ background: 'var(--gradient-aurora)', color: 'white' }}
                          >
                            {s.full_name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>
                              {s.full_name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{s.roll_number || '—'}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{s.branch || '—'}</td>
                      <td className="px-5 py-3 font-mono">{s.cgpa || '—'}</td>
                      <td className="px-5 py-3">
                        <MatchScoreRing score={s.profile_score || 0} size={36} strokeWidth={3} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(s.profile?.canonical_skills || []).slice(0, 3).map(skill => (
                            <SkillBadge key={skill} skill={skill} size="xs" />
                          ))}
                          {(s.profile?.canonical_skills || []).length > 3 && (
                            <span className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                              +{(s.profile?.canonical_skills || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-5 py-3">
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
