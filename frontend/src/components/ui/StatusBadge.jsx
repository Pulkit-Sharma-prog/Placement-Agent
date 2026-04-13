const STATUS_CONFIG = {
  applied:              { label: 'Applied',     color: '#3ECFCF',  bg: 'rgba(62,207,207,0.15)' },
  screening:            { label: 'Screening',   color: '#FF8C42',  bg: 'rgba(255,140,66,0.15)' },
  interview_scheduled:  { label: 'Interview',   color: '#6C63FF',  bg: 'rgba(108,99,255,0.15)' },
  interview_done:       { label: 'Interviewed', color: '#A855F7',  bg: 'rgba(168,85,247,0.15)' },
  offer_received:       { label: 'Offer',       color: '#4ADE80',  bg: 'rgba(74,222,128,0.15)' },
  accepted:             { label: 'Accepted',    color: '#4ADE80',  bg: 'rgba(74,222,128,0.2)' },
  rejected:             { label: 'Rejected',    color: '#F87171',  bg: 'rgba(248,113,113,0.15)' },
  active:               { label: 'Active',      color: '#4ADE80',  bg: 'rgba(74,222,128,0.15)' },
  closed:               { label: 'Closed',      color: '#F87171',  bg: 'rgba(248,113,113,0.15)' },
  placed:               { label: 'Placed',      color: '#4ADE80',  bg: 'rgba(74,222,128,0.2)' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || {
    label: status || 'Unknown',
    color: 'var(--text-muted)',
    bg: 'rgba(255,255,255,0.05)',
  }

  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}
