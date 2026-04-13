import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

export default function SkillRadarChart({ radar }) {
  const safeRadar = (radar && typeof radar === 'object' && !Array.isArray(radar)) ? radar : {}
  const data = Object.entries(safeRadar).map(([subject, value]) => ({ subject, value: Number(value) || 0 }))
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[220px] text-sm" style={{ color: 'var(--text-muted)' }}>No skill data</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3ECFCF" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <Radar
          dataKey="value" stroke="#6C63FF" fill="url(#radarFill)"
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
