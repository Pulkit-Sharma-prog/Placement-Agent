import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import PageWrapper from '../../components/layout/PageWrapper'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonTable } from '../../components/ui/SkeletonLoader'

const TYPE_COLORS = {
  match_alert: '#6C63FF',
  shortlist:   '#4ADE80',
  reminder:    '#FF8C42',
  digest:      '#3ECFCF',
}

export default function Notifications() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: () => api.get('/students/me/notifications').then(r => r.data.data),
  })

  const notifs = data || []
  const unreadCount = notifs.filter(n => !n.is_read).length

  async function markRead(id) {
    try {
      await api.patch(`/students/me/notifications/${id}/read`)
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] })
    } catch { /* silent */ }
  }

  return (
    <PageWrapper>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Notifications</h1>
          {unreadCount > 0 && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'rgba(108,99,255,0.2)', color: 'var(--purple)' }}
            >
              {unreadCount} unread
            </span>
          )}
        </div>

        {isLoading ? (
          <SkeletonTable rows={4} />
        ) : notifs.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            subtitle="You'll receive alerts here when you get job matches, shortlists, and interview reminders"
          />
        ) : (
          <div className="space-y-3">
            {notifs.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass-card p-4 flex gap-4 cursor-pointer transition-opacity hover:opacity-90 ${!n.is_read ? 'border-l-2' : ''}`}
                style={!n.is_read ? { borderLeftColor: TYPE_COLORS[n.type] || 'var(--purple)' } : {}}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${TYPE_COLORS[n.type] || '#6C63FF'}20` }}
                >
                  <Bell size={16} style={{ color: TYPE_COLORS[n.type] || '#6C63FF' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${n.is_read ? 'opacity-60' : ''}`}>{n.title}</p>
                    {n.is_read
                      ? <CheckCircle size={14} className="flex-shrink-0 mt-0.5 opacity-30" />
                      : <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: TYPE_COLORS[n.type] || 'var(--purple)' }} />
                    }
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{n.body}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
