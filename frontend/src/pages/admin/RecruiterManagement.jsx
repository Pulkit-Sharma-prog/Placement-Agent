import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Building2, ExternalLink } from 'lucide-react'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'

function EngagementBar({ score }) {
  const color = score >= 70 ? '#3ECFCF' : score >= 40 ? '#FF8C42' : '#FF6B9D'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

export default function RecruiterManagement() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-recruiters', search],
    queryFn: () =>
      api.get(`/recruiters?limit=50${search ? `&search=${search}` : ''}`)
        .then(r => r.data.data || r.data)
        .catch(() => []),
  })

  const recruiters = Array.isArray(data) ? data : []

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Recruiter Management</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {recruiters.length} registered recruiters
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or company..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : recruiters.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No recruiters found"
            subtitle="No recruiters are registered yet"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recruiters.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--purple)' }}
                    >
                      {r.company_name?.[0] || r.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">{r.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.email}</p>
                    </div>
                  </div>
                  <button
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Company</span>
                    <span className="font-medium">{r.company_name || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Industry</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                      {r.industry || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Active Jobs</span>
                    <span className="font-semibold" style={{ color: 'var(--purple)' }}>{r.jobs_count || 0}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>Engagement Score</span>
                  </div>
                  <EngagementBar score={r.engagement_score || 0} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
