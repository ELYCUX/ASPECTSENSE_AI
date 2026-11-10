import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RatingDistributionChart({ data = [] }) {
  const fallback = [
    { rating: '1★', count: 40 },
    { rating: '2★', count: 80 },
    { rating: '3★', count: 150 },
    { rating: '4★', count: 620 },
    { rating: '5★', count: 1110 },
  ];

  const chartData = data.length ? data : fallback;
  const total = chartData.reduce((s, d) => s + d.count, 0);

  const config = {
    labels: chartData.map(d => d.rating),
    datasets: [{
      data: chartData.map(d => d.count),
      backgroundColor: ['#3b82f6', '#60a5fa', '#93c5fd', '#a78bfa', '#818cf8'],
      borderColor: ['#0f172a'],
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter' },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${total ? ((ctx.parsed / total) * 100).toFixed(1) : 0}%)`,
        },
      },
    },
  };

  return (
    <div className="card p-6 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Rating Distribution</h3>
        <p className="text-xs text-gray-400 mb-4">Breakdown of all star ratings</p>
      </div>
      <div className="relative h-52">
        <Doughnut data={config} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
          <p className="text-2xl font-bold text-white tracking-tight">{total.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 font-medium">Total Reviews</p>
        </div>
      </div>
    </div>
  );
}
