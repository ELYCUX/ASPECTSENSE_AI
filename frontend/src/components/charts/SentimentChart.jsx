import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-800 px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 text-white">
        <p className="text-xs font-semibold mb-0.5" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
        <p className="text-gray-200 text-sm font-bold">{payload[0].value.toLocaleString()} reviews</p>
      </div>
    );
  }
  return null;
};

export default function SentimentChart({ data = [] }) {
  const fallback = [
    { name: 'Positive', value: 1120, color: '#10b981' },
    { name: 'Negative', value: 340,  color: '#ef4444' },
    { name: 'Neutral',  value: 540,  color: '#94a3b8' },
  ];
  const chartData = data.length ? data : fallback;

  return (
    <div className="card p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Sentiment Distribution</h3>
        <p className="text-xs text-gray-400 mb-4">Overall positive / negative / neutral breakdown</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={85}
              innerRadius={45}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(15,23,42,0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-5 mt-2">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
