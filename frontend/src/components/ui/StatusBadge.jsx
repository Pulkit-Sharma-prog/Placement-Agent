const STATUS_CONFIG = {
  applied:              { label: 'Applied',     color: '#64D2FF',  bg: 'rgba(100,210,255,0.15)' },
  screening:            { label: 'Screening',   color: '#FF9F0A',  bg: 'rgba(255,140,66,0.15)' },
  interview_scheduled:  { label: 'Interview',   color: '#0A84FF',  bg: 'rgba(10,132,255,0.15)' },
  interview_done:       { label: 'Interviewed', color: '#A855F7',  bg: 'rgba(168,85,247,0.15)' },
  offer_received:       { label: 'Offer',       color: '#32D74B',  bg: 'rgba(74,222,128,0.15)' },
  accepted:             { label: 'Accepted',    color: '#32D74B',  bg: 'rgba(74,222,128,0.2)' },
  rejected:             { label: 'Rejected',    color: '#FF453A',  bg: 'rgba(248,113,113,0.15)' },
  active:               { label: 'Active',      color: '#32D74B',  bg: 'rgba(74,222,128,0.15)' },
  closed:               { label: 'Closed',      color: '#FF453A',  bg: 'rgba(248,113,113,0.15)' },
  placed:               { label: 'Placed',      color: '#32D74B',  bg: 'rgba(74,222,128,0.2)' },
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
