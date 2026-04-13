import { motion } from 'framer-motion'
import { Calendar, Clock, Video } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import StatusBadge from '../../components/ui/StatusBadge'

const MOCK_INTERVIEWS = [
  { candidate: 'Arjun Sharma', role: 'Software Engineer — Backend', company: 'Google', date: '2024-06-20', time: '10:00 AM', type: 'Technical', status: 'interview_scheduled' },
  { candidate: 'Divya Menon', role: 'Frontend Engineer', company: 'Google', date: '2024-06-25', time: '2:00 PM', type: 'Technical', status: 'interview_scheduled' },
]

export default function InterviewSchedule() {
  return (
    <PageWrapper>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Interview Schedule</h1>

        <div className="space-y-4">
          {MOCK_INTERVIEWS.map((iv, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 flex items-center gap-5"
            >
              <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
                style={{ background: 'rgba(108,99,255,0.15)' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--purple)' }}>
                  {new Date(iv.date).toLocaleDateString('en', { month: 'short' })}
                </span>
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {new Date(iv.date).getDate()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">{iv.candidate}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {iv.role} · {iv.company}
                </p>
                <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><Clock size={11} />{iv.time}</span>
                  <span className="flex items-center gap-1"><Video size={11} />{iv.type}</span>
                </div>
              </div>
              <StatusBadge status={iv.status} />
            </motion.div>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
