import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0A84FF', '#64D2FF', '#FF375F', '#FF9F0A', '#32D74B', '#A855F7']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="font-bold" style={{ color: d.payload.fill }}>{d.name}</p>
      <p style={{ color: 'var(--text-secondary)' }}>{d.value} students · {d.payload.rate}%</p>
    </div>
  )
}

export default function BranchPieChart({ data }) {
  const safeData = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {}
  const chartData = Object.entries(safeData).map(([branch, v]) => ({
    name: branch,
    value: v.placed || 0,
    registered: v.registered || 0,
    rate: v.rate || 0,
  }))

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: 'var(--text-muted)' }}>No placement data yet</div>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
          dataKey="value" paddingAngle={3}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle" iconSize={8}
          formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
