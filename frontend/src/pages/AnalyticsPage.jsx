import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { SkeletonChart } from '../components/ui/SkeletonCard';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Brain, TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw } from 'lucide-react';

const ASPECT_COLORS = {
  Camera: '#3b82f6',
  Battery: '#10b981',
  Display: '#8b5cf6',
  Performance: '#f59e0b',
  'Build Quality': '#64748b',
  Price: '#ec4899',
  Delivery: '#14b8a6',
  Software: '#f97316',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-md border border-gray-100">
        <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
            <span className="text-gray-500 capitalize">{p.name}:</span>
            <span className="text-gray-900 font-semibold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { addToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('positive');
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get('/products?limit=100');
        setProducts(res.data.data.products);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    };
    loadProducts();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const url = selectedProductId ? `/reviews/aspect-sentiment?productId=${selectedProductId}` : '/reviews/aspect-sentiment';
      const res = await api.get(url);
      setData(res.data.data);
    } catch {
      addToast('Failed to load analytics data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedProductId]);

  const sortedData = [...data].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

  const enriched = sortedData.map(d => {
    const total = (d.positive || 0) + (d.negative || 0) + (d.neutral || 0) || 1;
    return {
      ...d,
      positivePct: Math.round(((d.positive || 0) / total) * 100),
      negativePct: Math.round(((d.negative || 0) / total) * 100),
      neutralPct: Math.round(((d.neutral || 0) / total) * 100),
      total,
    };
  });

  return (
    <div className="min-h-screen bg-transparent flex font-sans text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 pt-20 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1">Aspect Sentiment Analytics</h1>
                <p className="text-gray-400 text-sm">Deep-dive into per-aspect customer sentiment across all products</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="bg-surface-800 border border-white/10 text-gray-200 text-sm rounded-lg focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 block p-2 shadow-sm outline-none"
                >
                  <option value="">All Products</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button onClick={load} className="glass-lighter border border-white/10 text-gray-300 p-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors shadow-sm">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonChart /><SkeletonChart /><SkeletonChart /><SkeletonChart />
              </div>
            ) : (
              <>
                {/* Grouped Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-white">Sentiment by Aspect</h3>
                      <p className="text-xs text-gray-400 mt-1">Positive, Negative, Neutral counts per product aspect</p>
                    </div>
                    <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                      {['positive', 'negative', 'neutral'].map(s => (
                        <button
                          key={s}
                          onClick={() => setSortBy(s)}
                          className={`text-xs px-3 py-1.5 rounded-md capitalize transition font-medium ${sortBy === s
                              ? 'bg-primary-500/20 shadow-sm border border-primary-500/30 text-primary-400'
                              : 'text-gray-400 hover:text-white'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={sortedData} barSize={18} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="aspect" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} width={35} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(243,244,246,0.5)', radius: 4 }} />
                      <Legend formatter={v => <span className="text-xs text-gray-500 capitalize">{v}</span>} />
                      <Bar dataKey="positive" name="positive" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="neutral" name="neutral" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="negative" name="negative" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Aspect Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {enriched.map(({ aspect, positivePct, negativePct, neutralPct, total, positive, negative }, i) => {
                    const trending = positivePct >= 70 ? 'up' : positivePct < 45 ? 'down' : 'flat';
                    return (
                      <motion.div
                        key={aspect}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="card-kpi p-5"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-semibold text-white capitalize">{aspect}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{total} mentions</p>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trending === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              trending === 'down' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-white/5 text-gray-300'
                            }`}>
                            {trending === 'up' ? <TrendingUp className="w-3 h-3" /> :
                              trending === 'down' ? <TrendingDown className="w-3 h-3" /> :
                                <Minus className="w-3 h-3" />}
                            {positivePct}%
                          </div>
                        </div>

                        {/* Stacked bar */}
                        <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-white/5">
                          <div className="bg-emerald-500 transition-all glow-primary" style={{ width: `${positivePct}%` }} />
                          <div className="bg-gray-500 transition-all" style={{ width: `${neutralPct}%` }} />
                          <div className="bg-rose-500 transition-all shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `${negativePct}%` }} />
                        </div>

                        <div className="flex items-center justify-between text-center pt-2 border-t border-gray-100">
                          <div>
                            <p className="text-green-600 text-xs font-bold">{positivePct}%</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Pos</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-bold">{neutralPct}%</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Neu</p>
                          </div>
                          <div>
                            <p className="text-red-600 text-xs font-bold">{negativePct}%</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Neg</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Detailed Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card overflow-hidden"
                >
                  <div className="p-5 border-b border-white/5 bg-surface-800/20">
                    <h3 className="text-base font-semibold text-white">Detailed Aspect Breakdown</h3>
                    <p className="text-xs text-gray-400 mt-1">Complete sentiment counts and percentage distribution</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                      <thead className="bg-surface-800/50 text-gray-400 uppercase text-[11px] font-semibold tracking-wider border-b border-white/5">
                        <tr>
                          {['Aspect', 'Total', 'Positive', 'Negative', 'Neutral', 'Positive %', 'Negative %', 'Health Score'].map(h => (
                            <th key={h} className="px-5 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {enriched.map(d => (
                          <tr key={d.aspect} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: ASPECT_COLORS[d.aspect] || '#6366f1' }} />
                                <span className="font-medium text-gray-900 capitalize">{d.aspect}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-600 font-medium">{d.total}</td>
                            <td className="px-5 py-4 text-green-600 font-medium">{d.positive || 0}</td>
                            <td className="px-5 py-4 text-red-600 font-medium">{d.negative || 0}</td>
                            <td className="px-5 py-4 text-gray-500">{d.neutral || 0}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                                  <div className="bg-green-500 h-full rounded-full" style={{ width: `${d.positivePct}%` }} />
                                </div>
                                <span className="text-xs text-green-700 font-semibold w-8">{d.positivePct}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-xs text-red-700 font-semibold">{d.negativePct}%</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold border ${d.positivePct >= 70 ? 'bg-green-50 text-green-700 border-green-200' :
                                  d.positivePct >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                {d.positivePct >= 70 ? 'Excellent' : d.positivePct >= 50 ? 'Average' : 'Poor'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
