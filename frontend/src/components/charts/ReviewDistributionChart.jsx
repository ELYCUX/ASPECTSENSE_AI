import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-800 px-4 py-2.5 rounded-xl shadow-2xl border border-white/10 text-white">
        <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
        <p className="text-primary-400 text-sm font-bold">{payload[0].value.toLocaleString()} reviews</p>
      </div>
    );
  }
  return null;
};

export default function ReviewDistributionChart({ data = [] }) {
  const fallback = [
    { month: 'Feb', reviews: 120 },
    { month: 'Mar', reviews: 280 },
    { month: 'Apr', reviews: 190 },
    { month: 'May', reviews: 420 },
    { month: 'Jun', reviews: 310 },
    { month: 'Jul', reviews: 480 },
  ];

  const chartData = data.length ? data : fallback;

  return (
    <div className="card p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Reviews Over Time</h3>
        <p className="text-xs text-gray-400 mb-5">Monthly review volume over the last 6 months</p>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={chartData} barSize={28}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#4338ca" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 4 }} />
          <Bar dataKey="reviews" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
