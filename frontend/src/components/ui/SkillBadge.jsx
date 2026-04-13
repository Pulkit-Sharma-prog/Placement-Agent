export default function SkillBadge({ skill, size = 'sm', highlight = false }) {
  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-colors ${sizes[size]}`}
      style={{
        background: highlight ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${highlight ? 'rgba(108,99,255,0.5)' : 'var(--border-subtle)'}`,
        color: highlight ? '#6C63FF' : 'var(--text-secondary)',
      }}
    >
      {skill}
    </span>
  )
}
