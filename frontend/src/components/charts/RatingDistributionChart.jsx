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
      backgroundColor: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6'],
      borderColor: ['#ffffff'],
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#6b7280',
          font: { size: 11, family: 'Inter' },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        titleColor: '#111827',
        bodyColor: '#4b5563',
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${((ctx.parsed / total) * 100).toFixed(1)}%)`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Rating Distribution</h3>
      <p className="text-xs text-gray-500 mb-5">Breakdown of all star ratings</p>
      <div className="relative h-52">
        <Doughnut data={config} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>
    </div>
  );
}
