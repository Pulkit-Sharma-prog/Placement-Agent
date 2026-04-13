import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, subtitle, action, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      {Icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}
        >
          <Icon size={28} style={{ color: 'var(--purple)' }} />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title || 'Nothing here yet'}
      </h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-muted)' }}>
        {subtitle || 'Get started by creating your first item.'}
      </p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--gradient-aurora)' }}
        >
          {action}
        </button>
      )}
    </motion.div>
  )
}
