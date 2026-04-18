import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Briefcase, Users, Calendar, Award, UserPlus, TrendingUp, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import { StatCard, StatCardRow } from '../../components/ui/StatCard'
import MatchScoreRing from '../../components/ui/MatchScoreRing'
import SkillBadge from '../../components/ui/SkillBadge'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonTable, SkeletonCard } from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'

export default function RecruiterDashboard() {
  const navigate = useNavigate()

  const { data: jobsData, isLoading: loadingJobs } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: () => api.get('/jobs?limit=10').then(r => r.data),
  })

  const jobs = jobsData?.data || []
  const firstJobId = jobs[0]?.id

  const { data: shortlistData, isLoading: loadingShortlist } = useQuery({
    queryKey: ['job-shortlist', firstJobId],
    queryFn: () => api.get(`/jobs/${firstJobId}/shortlist?limit=8`).then(r => r.data.data),
    enabled: !!firstJobId,
  })

  // Skill demand data
  const { data: demandData } = useQuery({
    queryKey: ['skill-demand'],
    queryFn: () => api.get('/jobs/skill-demand').then(r => r.data.data),
  })

  const shortlist = shortlistData || []
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0)
  const topDemanded = demandData?.top_demanded_skills?.slice(0, 8) || []

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Recruiter Portal
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Manage your job postings and candidate pipeline
            </p>
          </div>
          <button
            onClick={() => navigate('/recruiter/jobs/new')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'var(--gradient-aurora)' }}
          >
            + Post New Job
          </button>
        </div>

        <StatCardRow>
          <StatCard icon={Briefcase} label="Active Jobs"       value={jobs.length}      color="#0A84FF" />
          <StatCard icon={Users}     label="Total Applicants"  value={totalApplicants}  color="#64D2FF" />
          <StatCard icon={Calendar}  label="Candidates Matched" value={shortlist.length} color="#FF375F" />
          <StatCard icon={Award}     label="Top Match"
            value={shortlist[0] ? `${Math.round(shortlist[0].match_score)}%` : '—'}
            color="#FF9F0A"
          />
        </StatCardRow>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Candidates */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Top Candidates</h2>
                {firstJobId && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Shortlisted for: {jobs[0]?.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate('/recruiter/candidates')}
                className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--purple)' }}
              >
                View All <ChevronRight size={12} />
              </button>
            </div>

            {loadingShortlist || loadingJobs ? (
              <SkeletonTable rows={4} />
            ) : shortlist.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="No candidates yet"
                subtitle="Candidates will appear here once students upload their resumes and match your job postings"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Name', 'Branch', 'CGPA', 'Match', 'Skills', ''].map(h => (
                        <th key={h} className="text-left pb-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shortlist.map((c, i) => (
                      <motion.tr
                        key={c.student_id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onClick={() => navigate(`/recruiter/candidates/${c.student_id}`)}
                      >
                        <td className="py-3">
                          <p className="font-medium text-sm">{c.name}</p>
                          {c.profile_score > 0 && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              Profile: {c.profile_score}
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{c.branch}</td>
                        <td className="py-3 text-sm font-mono">{c.cgpa || '—'}</td>
                        <td className="py-3">
                          <MatchScoreRing score={c.match_score || 0} size={40} strokeWidth={4} />
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 flex-wrap">
                            {(c.skill_overlap || c.skills || []).slice(0, 3).map(s => (
                              <SkillBadge key={s} skill={s} size="xs" highlight />
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Job Postings */}
            <div className="glass-card p-5">
              <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Your Jobs</h2>
              <div className="space-y-3">
                {loadingJobs ? (
                  <SkeletonTable rows={3} />
                ) : jobs.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No jobs posted yet
                  </p>
                ) : (
                  jobs.slice(0, 5).map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-xl cursor-pointer transition-all hover:border-purple-500/20"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid transparent' }}
                      onClick={() => navigate('/recruiter/jobs')}
                    >
                      <p className="text-sm font-medium truncate">{job.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {job.applications_count || 0} applicants
                        </p>
                        <StatusBadge status={job.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* In-demand skills */}
            {topDemanded.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} style={{ color: 'var(--teal)' }} />
                  <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                    Market Demand
                  </h2>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Most demanded skills across {demandData?.total_active_jobs || 0} active jobs
                </p>
                <div className="space-y-2">
                  {topDemanded.map((s, i) => {
                    const maxCount = topDemanded[0]?.demand_count || 1
                    const pct = (s.demand_count / maxCount) * 100
                    return (
                      <div key={s.skill}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-xs font-medium">{s.skill}</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {s.demand_count} jobs
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.1 * i, duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ background: 'var(--gradient-aurora)' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
