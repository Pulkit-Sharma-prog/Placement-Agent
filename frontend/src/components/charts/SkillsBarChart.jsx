import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const COLORS = ['#0A84FF','#64D2FF','#FF375F','#FF9F0A','#32D74B','#A855F7','#EC4899','#F59E0B','#10B981','#3B82F6']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{payload[0].payload.skill}</p>
      <p style={{ color: 'var(--text-secondary)' }}>{payload[0].value} jobs</p>
    </div>
  )
}

export default function SkillsBarChart({ data }) {
  const safeData = Array.isArray(data) ? data : []
  if (safeData.length === 0) {
    return <div className="flex items-center justify-center h-[220px] text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</div>
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={safeData} layout="vertical" margin={{ left: 20, right: 10 }}>
        <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="skill" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="frequency" radius={[0, 4, 4, 0]} maxBarSize={14}>
          {safeData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
