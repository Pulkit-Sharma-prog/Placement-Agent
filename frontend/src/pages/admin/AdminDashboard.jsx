import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Briefcase, TrendingUp, Award } from 'lucide-react'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import { StatCard, StatCardRow } from '../../components/ui/StatCard'
import OffersLineChart from '../../components/charts/OffersLineChart'
import BranchPieChart from '../../components/charts/BranchPieChart'
import SkillsBarChart from '../../components/charts/SkillsBarChart'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'

export default function AdminDashboard() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data.data).catch(() => ({})),
  })

  const { data: monthly } = useQuery({
    queryKey: ['admin-monthly'],
    queryFn: () => api.get('/analytics/monthly-offers').then(r => r.data.data).catch(() => []),
  })

  const { data: branch } = useQuery({
    queryKey: ['admin-branch'],
    queryFn: () => api.get('/analytics/branch-breakdown').then(r => r.data.data).catch(() => ({})),
  })

  const { data: skills } = useQuery({
    queryKey: ['admin-skills'],
    queryFn: () => api.get('/analytics/skills-demand').then(r => r.data.data).catch(() => []),
  })

  const ov = overview || {}

  // Funnel data built from overview stats
  const total = ov.total_students || 0
  const funnel = [
    { label: 'Total Students',  value: total,                         color: '#6C63FF' },
    { label: 'Applications',    value: ov.total_applications || 0,    color: '#3ECFCF' },
    { label: 'Interviews',      value: ov.interviews_scheduled || 0,  color: '#FF8C42' },
    { label: 'Offers Made',     value: ov.offers_made || 0,           color: '#FF6B9D' },
  ]

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Placement cell overview and analytics
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <StatCardRow>
            <StatCard icon={Users}      label="Total Students" value={ov.total_students || 0}                                             color="#6C63FF" delta={ov.placement_rate ? `${ov.placement_rate.toFixed(1)}% placed` : undefined} />
            <StatCard icon={Briefcase}  label="Active Jobs"    value={ov.active_jobs || 0}                                               color="#3ECFCF" />
            <StatCard icon={TrendingUp} label="Avg CTC (LPA)"  value={ov.avg_ctc ? `₹${(ov.avg_ctc / 100000).toFixed(1)}L` : '—'}      color="#FF8C42" />
            <StatCard icon={Award}      label="Offers Made"    value={ov.offers_made || 0}                                               color="#FF6B9D" />
          </StatCardRow>
        )}

        {/* Charts 2×2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Monthly Offers Trend</h2>
            <OffersLineChart data={Array.isArray(monthly) ? monthly : []} />
          </motion.div>

          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Placement by Branch</h2>
            <BranchPieChart data={branch && typeof branch === 'object' ? branch : {}} />
          </motion.div>

          {/* Funnel */}
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Placement Funnel</h2>
            <div className="space-y-3 mt-2">
              {funnel.map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>{item.label}</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                  <div className="h-6 rounded-lg overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <motion.div
                      className="h-full rounded-lg"
                      style={{ background: item.color, opacity: 0.85 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Top In-Demand Skills</h2>
            <SkillsBarChart data={Array.isArray(skills) ? skills : []} />
          </motion.div>
        </div>

        {/* Top Companies */}
        {ov.top_companies?.length > 0 && (
          <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Top Hiring Companies</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ov.top_companies.slice(0, 8).map((co, i) => (
                <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="font-semibold text-sm">{co.company}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--purple)' }}>{co.offers} offers</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
