import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Briefcase, Users, Calendar, Award, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import { StatCard, StatCardRow } from '../../components/ui/StatCard'
import MatchScoreRing from '../../components/ui/MatchScoreRing'
import SkillBadge from '../../components/ui/SkillBadge'
import StatusBadge from '../../components/ui/StatusBadge'
import { SkeletonTable } from '../../components/ui/SkeletonLoader'
import EmptyState from '../../components/ui/EmptyState'

export default function RecruiterDashboard() {
  const navigate = useNavigate()

  const { data: jobsData, isLoading: loadingJobs } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: () => api.get('/jobs?limit=10').then(r => r.data),
  })

  const jobs = jobsData?.data || []
  const firstJobId = jobs[0]?.id

  // Get real shortlist from the first job
  const { data: shortlistData, isLoading: loadingShortlist } = useQuery({
    queryKey: ['job-shortlist', firstJobId],
    queryFn: () => api.get(`/jobs/${firstJobId}/shortlist?limit=8`).then(r => r.data.data),
    enabled: !!firstJobId,
  })

  const shortlist = shortlistData || []

  // Calculate real stats from jobs
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0)
  const interviewCount = jobs.reduce((sum, j) => sum + (j.interviews_count || 0), 0)
  const offersCount = jobs.reduce((sum, j) => sum + (j.offers_count || 0), 0)

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Recruiter Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your job postings and candidate pipeline
          </p>
        </div>

        <StatCardRow>
          <StatCard icon={Briefcase} label="Active Jobs"     value={jobs.length}     color="#6C63FF" />
          <StatCard icon={Users}     label="Total Applicants" value={totalApplicants} color="#3ECFCF" />
          <StatCard icon={Calendar}  label="Shortlisted"     value={shortlist.length} color="#FF6B9D" />
          <StatCard icon={Award}     label="Offers Made"     value={offersCount}     color="#FF8C42" />
        </StatCardRow>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Candidates from real shortlist */}
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
                className="text-xs hover:opacity-70 transition-opacity"
                style={{ color: 'var(--purple)' }}
              >
                View All
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
                      {['Name', 'Branch', 'CGPA', 'Match', 'Skills'].map(h => (
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
                      >
                        <td className="py-3 font-medium text-sm">{c.name || c.full_name}</td>
                        <td className="py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{c.branch}</td>
                        <td className="py-3 text-sm font-mono">{c.cgpa || '—'}</td>
                        <td className="py-3">
                          <MatchScoreRing score={c.match_score || c.score || 0} size={40} strokeWidth={4} />
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 flex-wrap">
                            {(c.skills || c.canonical_skills || []).slice(0, 3).map(s => (
                              <SkillBadge key={s} skill={s} size="xs" />
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Job stats */}
          <div className="glass-card p-5">
            <h2 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Your Job Postings</h2>
            <div className="space-y-3">
              {loadingJobs ? (
                <SkeletonTable rows={3} />
              ) : jobs.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  No jobs posted yet
                </p>
              ) : (
                jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
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
              <button
                onClick={() => navigate('/recruiter/jobs/new')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-2 hover:opacity-90 transition-opacity"
                style={{ background: 'var(--gradient-aurora)' }}
              >
                + Post New Job
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
