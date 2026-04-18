import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import OffersLineChart from '../../components/charts/OffersLineChart'
import BranchPieChart from '../../components/charts/BranchPieChart'
import SkillsBarChart from '../../components/charts/SkillsBarChart'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'

function MetricCard({ label, value, sub }) {
  return (
    <div className="glass-card p-5 text-center">
      <p className="text-3xl font-bold aurora-text" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data.data).catch(() => ({})),
  })

  const { data: monthly } = useQuery({
    queryKey: ['analytics-monthly'],
    queryFn: () => api.get('/analytics/monthly-offers').then(r => r.data.data).catch(() => []),
  })

  const { data: branch } = useQuery({
    queryKey: ['analytics-branch'],
    queryFn: () => api.get('/analytics/branch-breakdown').then(r => r.data.data).catch(() => ({})),
  })

  const { data: skills } = useQuery({
    queryKey: ['analytics-skills'],
    queryFn: () => api.get('/analytics/skills-demand').then(r => r.data.data).catch(() => []),
  })

  const { data: ctcRes } = useQuery({
    queryKey: ['analytics-ctc'],
    queryFn: () => api.get('/analytics/ctc-distribution').then(r => r.data.data).catch(() => ({})),
  })

  async function handleExport() {
    try {
      const res = await api.post('/analytics/export', {}, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'placement-analytics.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Report exported!')
    } catch {
      toast.error('Export failed')
    }
  }

  const ov = overview || {}

  // CTC buckets from the API response
  const ctcBuckets = ctcRes?.buckets || []

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Analytics</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Placement insights and trends</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <Download size={15} /> Export PDF
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Placement Rate" value={`${ov.placement_rate?.toFixed(1) || 0}%`} sub={`${ov.total_students || 0} students total`} />
            <MetricCard label="Avg CTC" value={`₹${((ov.avg_ctc || 0) / 100000).toFixed(1)}L`} sub={ov.max_ctc ? `Max ₹${(ov.max_ctc / 100000).toFixed(1)}L` : undefined} />
            <MetricCard label="Total Offers" value={ov.offers_made || 0} sub={`${ov.interviews_scheduled || 0} interviews`} />
            <MetricCard label="Active Jobs" value={ov.active_jobs || 0} sub={`${ov.total_applications || 0} applications`} />
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Monthly Offers</h2>
            <OffersLineChart data={Array.isArray(monthly) ? monthly : []} />
          </motion.div>
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Branch-wise Placement</h2>
            <BranchPieChart data={branch && typeof branch === 'object' && !Array.isArray(branch) ? branch : {}} />
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Skills in Demand</h2>
            <SkillsBarChart data={Array.isArray(skills) ? skills : []} />
          </motion.div>

          {/* CTC Distribution */}
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>CTC Distribution</h2>
            {ctcBuckets.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No offer data yet
              </p>
            ) : (
              <div className="space-y-4 mt-2">
                {ctcBuckets.map((bucket, i) => {
                  const total = ctcBuckets.reduce((s, b) => s + b.count, 0)
                  const pct = total > 0 ? (bucket.count / total) * 100 : 0
                  const colors = ['#FF375F', '#FF9F0A', '#64D2FF', '#0A84FF', '#32D74B']
                  return (
                    <div key={bucket.range}>
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>{bucket.range}</span>
                        <span>{bucket.count} students ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-5 rounded-lg overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <motion.div
                          className="h-full rounded-lg"
                          style={{ background: colors[i % colors.length], opacity: 0.8 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.07 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Top Companies */}
        {ov.top_companies?.length > 0 && (
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Top Hiring Companies</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {ov.top_companies.slice(0, 10).map((co, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="font-semibold text-sm truncate">{co.company}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--purple)' }}>{co.offers} offers</p>
                  {co.avg_ctc && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>avg ₹{(co.avg_ctc / 100000).toFixed(1)}L</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
