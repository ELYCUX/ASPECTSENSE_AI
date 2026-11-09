import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-md border border-gray-100">
        <p className="text-sm font-semibold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
        <p className="text-gray-900 text-sm font-bold">{payload[0].value.toLocaleString()} reviews</p>
      </div>
    );
  }
  return null;
};

export default function SentimentChart({ data = [] }) {
  const fallback = [
    { name: 'Positive', value: 1120, color: '#10b981' },
    { name: 'Negative', value: 340,  color: '#ef4444' },
    { name: 'Neutral',  value: 540,  color: '#9ca3af' },
  ];
  const chartData = data.length ? data : fallback;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Sentiment Distribution</h3>
      <p className="text-xs text-gray-500 mb-4">Overall positive / negative / neutral breakdown</p>
      <ResponsiveContainer width="100%" height={220}>
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
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry) => (
              <span style={{ color: '#6b7280', fontSize: 11 }}>{value}</span>
            )}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
