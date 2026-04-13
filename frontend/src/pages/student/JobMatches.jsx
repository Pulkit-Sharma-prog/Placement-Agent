import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Upload, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import MatchScoreRing from '../../components/ui/MatchScoreRing'
import SkillBadge from '../../components/ui/SkillBadge'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'

export default function JobMatches() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [applying, setApplying] = useState(null)

  // Check if user has resume first
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/students/me').then(r => r.data.data),
  })

  const hasResume = profileData?.has_resume && profileData?.profile?.canonical_skills?.length > 0

  // Fetch real AI matches (only when resume exists)
  const { data: matchesRes, isLoading: loadingMatches } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => api.get('/students/me/matches?limit=50').then(r => r.data),
    enabled: hasResume,
  })

  const allMatches = matchesRes?.data || []

  // Client-side search filter
  const matches = search
    ? allMatches.filter(m =>
        m.job.title.toLowerCase().includes(search.toLowerCase()) ||
        m.job.company.toLowerCase().includes(search.toLowerCase()) ||
        (m.job.required_skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
      )
    : allMatches

  async function handleApply(jobId) {
    if (applying) return
    setApplying(jobId)
    try {
      await api.post('/applications', { job_id: jobId })
      toast.success('Applied successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Apply failed')
    } finally {
      setApplying(null)
    }
  }

  const isLoading = loadingProfile || loadingMatches

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Job Matches</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {hasResume
              ? `${matches.length} AI-matched jobs ranked by your fit score`
              : 'Upload your resume to see personalised job matches'}
          </p>
        </div>

        {/* No resume state */}
        {!loadingProfile && !hasResume && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 flex flex-col items-center text-center gap-4"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(108,99,255,0.15)' }}
            >
              <Upload size={28} style={{ color: 'var(--purple)' }} />
            </div>
            <div>
              <p className="font-semibold text-lg">No resume uploaded yet</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Upload your resume first. Our AI will analyse your skills and match you to the best available jobs.
              </p>
            </div>
            <button
              onClick={() => navigate('/student/profile')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--gradient-aurora)' }}
            >
              Upload Resume
            </button>
          </motion.div>
        )}

        {/* Search — only shown when resume exists */}
        {hasResume && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by role, company or skill..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Match cards */}
        {!isLoading && hasResume && (
          <>
            {matches.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {search ? 'No matches found for your search' : 'No matches yet — matches compute when jobs are available'}
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {matches.map((m, i) => (
                  <motion.div
                    key={m.match_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-5 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-sm leading-tight">{m.job.title}</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {m.job.company}
                        </p>
                      </div>
                      <MatchScoreRing score={m.score} size={52} strokeWidth={4} />
                    </div>

                    <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />{m.job.location || 'Remote'}
                      </span>
                      <span>
                        {m.job.ctc_min && m.job.ctc_max
                          ? `₹${(m.job.ctc_min / 100000).toFixed(0)}–${(m.job.ctc_max / 100000).toFixed(0)}L`
                          : 'Competitive'}
                      </span>
                    </div>

                    {/* Matched skills */}
                    {m.skill_overlap?.length > 0 && (
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Your matching skills</p>
                        <div className="flex flex-wrap gap-1">
                          {m.skill_overlap.slice(0, 4).map(s => (
                            <SkillBadge key={s} skill={s} size="xs" highlight />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing skills */}
                    {m.missing_skills?.length > 0 && (
                      <div>
                        <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Skills to learn</p>
                        <div className="flex flex-wrap gap-1">
                          {m.missing_skills.slice(0, 3).map(s => (
                            <span
                              key={s}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,107,157,0.1)', color: '#FF6B9D' }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleApply(m.job.id)}
                      disabled={applying === m.job.id}
                      className="mt-auto w-full py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: 'var(--gradient-aurora)' }}
                    >
                      {applying === m.job.id ? 'Applying...' : 'Apply Now'}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
