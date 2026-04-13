import { motion } from 'framer-motion'

export default function MatchScoreRing({ score = 0, size = 60, strokeWidth = 5 }) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color = score >= 80 ? '#4ADE80' : score >= 60 ? '#3ECFCF' : score >= 40 ? '#FF8C42' : '#F87171'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth}
        />
        {/* Animated foreground ring */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold"
        style={{ color, fontFamily: 'var(--font-heading)' }}
      >
        {Math.round(score)}%
      </span>
    </div>
  )
}
