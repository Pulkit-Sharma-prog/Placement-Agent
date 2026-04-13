import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'
import SkillBadge from '../../components/ui/SkillBadge'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'

export default function JobPostings() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-jobs-all'],
    queryFn: () => api.get('/jobs?limit=20').then(r => r.data.data),
  })

  const jobs = data || []

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Job Postings</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {jobs.length} active postings
            </p>
          </div>
          <button
            onClick={() => navigate('/recruiter/jobs/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'var(--gradient-aurora)' }}
          >
            <Plus size={16} /> Post New Job
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            {jobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <div className="flex gap-4 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {job.applications_count || 0} applicants
                  </span>
                  {job.application_deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(job.application_deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {job.required_skills?.slice(0, 4).map(s => <SkillBadge key={s} skill={s} size="xs" />)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/recruiter/candidates?job=${job.id}`)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--purple)' }}
                  >
                    View Candidates
                  </button>
                  <button className="px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    Edit
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
