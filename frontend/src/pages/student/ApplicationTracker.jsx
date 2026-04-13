import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/SkeletonLoader'

const STAGES = ['applied', 'screening', 'interview_scheduled', 'interview_done', 'offer_received', 'accepted']

export default function ApplicationTracker() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api.get('/students/me/applications').then(r => r.data.data),
  })

  const apps = data || []

  // Count per stage for the pipeline visualization
  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.status === s).length
    return acc
  }, {})
  const activeStage = apps[0]?.status || null

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Application Tracker</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {apps.length > 0 ? `${apps.length} application${apps.length !== 1 ? 's' : ''}` : 'Track all your applications in one place'}
          </p>
        </div>

        {/* Pipeline visualization */}
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Application Pipeline</h2>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STAGES.map((stage, i) => {
              const count = stageCounts[stage] || 0
              const isActive = stage === activeStage
              return (
                <div key={stage} className="flex items-center gap-1 flex-shrink-0">
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-medium relative"
                    style={{
                      background: isActive ? 'rgba(108,99,255,0.3)' : count > 0 ? 'rgba(62,207,207,0.15)' : 'var(--bg-elevated)',
                      color: isActive ? '#6C63FF' : count > 0 ? '#3ECFCF' : 'var(--text-muted)',
                      border: `1px solid ${isActive ? 'rgba(108,99,255,0.5)' : count > 0 ? 'rgba(62,207,207,0.3)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    {count > 0 && (
                      <span
                        className="ml-1.5 px-1 rounded-full text-xs"
                        style={{ background: isActive ? '#6C63FF' : '#3ECFCF', color: 'white' }}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="w-4 h-px" style={{ background: 'var(--border-subtle)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Applications list */}
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : apps.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications yet"
            subtitle="Browse job matches and apply to start tracking your applications here"
            action="Browse Jobs"
            onAction={() => navigate('/student/jobs')}
          />
        ) : (
          <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {apps.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--purple)' }}
                >
                  {(app.job?.company || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-medium text-sm">{app.job?.title || 'Unknown Role'}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {app.job?.company}{app.job?.location ? ` · ${app.job.location}` : ''} ·{' '}
                    Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
                <div className="text-right text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {app.ctc_offered && (
                    <p className="font-medium" style={{ color: '#3ECFCF' }}>
                      ₹{(app.ctc_offered / 100000).toFixed(1)}L offered
                    </p>
                  )}
                  {app.last_updated && (
                    <p>Updated {new Date(app.last_updated).toLocaleDateString()}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
