import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="font-bold" style={{ color: 'var(--teal)' }}>{payload[0].value} offers</p>
    </div>
  )
}

export default function OffersLineChart({ data }) {
  const safeData = Array.isArray(data) ? data : []
  if (safeData.length === 0) {
    return <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: 'var(--text-muted)' }}>No data yet</div>
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={safeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#0A84FF" />
            <stop offset="100%" stopColor="#64D2FF" />
          </linearGradient>
        </defs>
        <Line
          type="monotone" dataKey="offers"
          stroke="url(#lineGrad)" strokeWidth={2.5}
          dot={{ fill: '#0A84FF', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#64D2FF' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
