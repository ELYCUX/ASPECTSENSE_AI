import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-md border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
        <p className="text-blue-600 text-sm font-bold">{payload[0].value.toLocaleString()} reviews</p>
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
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Reviews Over Time</h3>
      <p className="text-xs text-gray-500 mb-5">Monthly review volume over the last 6 months</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={28}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)', radius: 4 }} />
          <Bar dataKey="reviews" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
