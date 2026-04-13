import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => {
    const fixed = v.toFixed(decimals)
    return `${prefix}${Number(fixed).toLocaleString()}${suffix}`
  })

  useEffect(() => {
    const controls = animate(count, typeof value === 'number' ? value : 0, {
      duration: 1.5,
      ease: 'easeOut',
    })
    return controls.stop
  }, [value])

  return <motion.span>{rounded}</motion.span>
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } }
}

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

export function StatCard({ icon: Icon, label, value, prefix = '', suffix = '', color, delta, deltaLabel }) {
  return (
    <motion.div
      variants={cardVariants}
      className="glass-card p-6 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p
          className="text-3xl font-bold mt-1 aurora-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={0} />
        </p>
        {deltaLabel && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{deltaLabel}</p>
        )}
      </div>
    </motion.div>
  )
}

export function StatCardRow({ children }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {children}
    </motion.div>
  )
}
