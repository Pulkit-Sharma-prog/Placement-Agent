import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Target, FileText, Calendar, Trophy, Upload, ChevronRight, AlertCircle, Sparkles, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import { StatCard, StatCardRow } from '../../components/ui/StatCard'
import MatchScoreRing from '../../components/ui/MatchScoreRing'
import SkillBadge from '../../components/ui/SkillBadge'
import StatusBadge from '../../components/ui/StatusBadge'
import SkillRadarChart from '../../components/charts/SkillRadarChart'
import { SkeletonCard } from '../../components/ui/SkeletonLoader'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: studentData, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/students/me').then(r => r.data.data),
  })

  const student = studentData || null
  const profile = student?.profile || null
  const hasResume = student?.has_resume && profile?.canonical_skills?.length > 0

  const { data: matchesRes, isLoading: loadingMatches } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => api.get('/students/me/matches?limit=5').then(r => r.data),
    enabled: hasResume,
  })

  const { data: appsRes, isLoading: loadingApps } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api.get('/students/me/applications').then(r => r.data.data),
  })

  const matches = matchesRes?.data || []
  const apps = appsRes || []

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  const firstName = student?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'
  const bestScore = matches[0]?.score || 0
  const interviewCount = apps.filter(a => a.status === 'interview_scheduled').length

  // Profile completion %
  const completionSteps = [
    !!student?.full_name,
    !!student?.branch,
    !!student?.cgpa,
    hasResume,
    apps.length > 0,
  ]
  const completion = Math.round((completionSteps.filter(Boolean).length / completionSteps.length) * 100)

  if (loadingProfile) {
    return (
      <PageWrapper>
        <div className="space-y-6">
          <div className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{
            background: 'radial-gradient(ellipse at 60% 40%, rgba(10,132,255,0.25) 0%, transparent 60%), var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            {greeting}, <span className="aurora-text">{firstName}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {hasResume ? 'Your placement journey at a glance' : 'Upload your resume to get started'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-aurora)' }}
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {completion}% Profile Complete
            </span>
          </div>
        </motion.div>

        {/* Upload CTA — shown when no resume */}
        {!hasResume && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 flex items-center gap-5 cursor-pointer hover:border-purple-500/40 transition-colors"
            style={{ border: '2px dashed var(--border-subtle)' }}
            onClick={() => navigate('/student/profile')}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(10,132,255,0.15)' }}
            >
              <Upload size={22} style={{ color: 'var(--purple)' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Upload your resume to unlock everything</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Our AI will parse your skills, compute your match score, and find the best job matches for you.
              </p>
            </div>
            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
          </motion.div>
        )}

        {/* Stats — real data only */}
        <StatCardRow>
          <StatCard
            icon={Target}
            label="Best Match"
            value={hasResume ? Math.round(bestScore) : '—'}
            suffix={hasResume ? '%' : ''}
            color="#0A84FF"
          />
          <StatCard
            icon={FileText}
            label="Applications"
            value={apps.length}
            color="#64D2FF"
          />
          <StatCard
            icon={Calendar}
            label="Interviews"
            value={interviewCount}
            color="#FF375F"
          />
          <StatCard
            icon={Trophy}
            label="Profile Score"
            value={hasResume ? Math.round(profile?.profile_score || 0) : '—'}
            suffix={hasResume ? '' : ''}
            color="#FF9F0A"
          />
        </StatCardRow>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Job matches */}
          <div className="lg:col-span-3">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Top Job Matches</h2>
                {hasResume && (
                  <button
                    onClick={() => navigate('/student/jobs')}
                    className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--purple)' }}
                  >
                    View all <ChevronRight size={12} />
                  </button>
                )}
              </div>

              {!hasResume ? (
                <div className="py-8 text-center">
                  <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Upload your resume to see AI-powered job matches
                  </p>
                  <button
                    onClick={() => navigate('/student/profile')}
                    className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ background: 'var(--gradient-aurora)' }}
                  >
                    Upload Resume
                  </button>
                </div>
              ) : loadingMatches ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  No matches found yet. Matches will appear once jobs are available.
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.map((m) => (
                    <motion.div
                      key={m.match_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-3 rounded-xl transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <MatchScoreRing score={m.score} size={48} strokeWidth={4} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.job.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {m.job.company} · {m.job.location}
                        </p>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {(m.skill_overlap || []).slice(0, 3).map(s => (
                            <SkillBadge key={s} skill={s} size="xs" highlight />
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium" style={{ color: '#64D2FF' }}>
                          {m.job.ctc_max ? `₹${(m.job.ctc_max / 100000).toFixed(0)}L` : 'Competitive'}
                        </p>
                        <button
                          onClick={() => navigate('/student/jobs')}
                          className="mt-1.5 text-xs px-3 py-1 rounded-lg font-medium"
                          style={{ background: 'rgba(10,132,255,0.2)', color: '#0A84FF' }}
                        >
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Radar + Applications */}
          <div className="lg:col-span-2 space-y-4">
            {/* Skill radar — only when resume uploaded */}
            {hasResume && profile?.skill_radar && Object.keys(profile.skill_radar).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-5"
              >
                <h2 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Skill Profile</h2>
                <SkillRadarChart radar={profile.skill_radar} />
              </motion.div>
            )}

            {/* Applications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Applications</h2>
                <button
                  onClick={() => navigate('/student/applications')}
                  className="text-xs hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--purple)' }}
                >
                  View all
                </button>
              </div>

              {loadingApps ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                  ))}
                </div>
              ) : apps.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  No applications yet
                </p>
              ) : (
                <div className="space-y-3">
                  {apps.slice(0, 4).map((app) => (
                    <div key={app.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{app.job?.company}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{app.job?.title}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── Jobs Matching Your Skills ────────────────────────────────── */}
        {hasResume && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} style={{ color: 'var(--purple)' }} />
                <h2 className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Jobs Matching Your Skills
                </h2>
              </div>
              <button
                onClick={() => navigate('/student/jobs')}
                className="text-xs flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--purple)' }}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              These jobs specifically require skills you already have.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matches.slice(0, 6).map((m, i) => {
                const overlapCount = (m.skill_overlap || []).length
                const requiredCount = (m.job.required_skills || []).length
                const coveragePct = requiredCount > 0 ? Math.round((overlapCount / requiredCount) * 100) : 0
                return (
                  <motion.div
                    key={m.match_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="p-4 rounded-xl transition-all hover:border-purple-500/30 cursor-pointer"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    onClick={() => navigate('/student/jobs')}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{m.job.title}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {m.job.company}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-lg font-bold aurora-text">{Math.round(m.score)}%</span>
                      </div>
                    </div>

                    {/* Skill coverage bar */}
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                          Skill coverage
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: coveragePct >= 70 ? '#32D74B' : coveragePct >= 40 ? '#FFC837' : '#FF375F' }}>
                          {overlapCount}/{requiredCount} skills
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${coveragePct}%`,
                            background: coveragePct >= 70 ? '#32D74B' : coveragePct >= 40 ? 'var(--gradient-aurora)' : '#FF375F',
                          }}
                        />
                      </div>
                    </div>

                    {/* Matching skills */}
                    <div className="flex flex-wrap gap-1">
                      {(m.skill_overlap || []).slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(10,132,255,0.12)', color: '#0A84FF' }}>
                          {s}
                        </span>
                      ))}
                      {(m.missing_skills || []).slice(0, 2).map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,55,95,0.1)', color: '#FF375F' }}>
                          +{s}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
