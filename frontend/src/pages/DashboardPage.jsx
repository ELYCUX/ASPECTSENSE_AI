import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import KPICard from '../components/ui/KPICard';
import SkeletonCard, { SkeletonChart, SkeletonRow } from '../components/ui/SkeletonCard';
import ReviewDistributionChart from '../components/charts/ReviewDistributionChart';
import RatingDistributionChart from '../components/charts/RatingDistributionChart';
import SentimentChart from '../components/charts/SentimentChart';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import {
  MessageSquare, Package, Star, ThumbsUp, ThumbsDown, Cpu,
  RefreshCw, TrendingUp, ExternalLink, Clock, AlertCircle,
  Activity, Database, Server, MapPin, Zap, Plus, Upload, FileText, Users, CheckCircle, ShieldCheck, User, Download, Loader2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const getSentimentBadge = (sentiment) => {
  switch (sentiment) {
    case 'positive': return 'bg-green-100 text-green-700 border-green-200';
    case 'negative': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const location = useLocation();
  const [isBatchView, setIsBatchView] = useState(false);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get('/reports/csv', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aspect_sense_reviews_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('CSV export downloaded successfully', 'success');
    } catch (err) {
      const token = localStorage.getItem('aspectai_token') || localStorage.getItem('token');
      if (token) {
        window.open(`${api.defaults.baseURL}/reports/csv?token=${token}`, '_blank');
      } else {
        addToast('Failed to export CSV report', 'error');
      }
    } finally {
      setExporting(false);
    }
  };

  const loadData = async (isRefresh = false) => {
    // If refreshing from batch view, clear the state instead of fetching normally and keeping batch mode
    if (isRefresh && isBatchView) {
      window.history.replaceState({}, document.title)
      setIsBatchView(false);
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const statsPromise = api.get(`/dashboard/stats${isRefresh ? '?refresh=true' : ''}`);
      const reviewPromise = api.get('/reviews?limit=6');

      const [statsRes, reviewRes] = await Promise.allSettled([statsPromise, reviewPromise]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.data) {
        setStats(statsRes.value.data.data);
      }
      if (reviewRes.status === 'fulfilled' && reviewRes.value?.data?.data?.reviews) {
        setReviews(reviewRes.value.data.data.reviews);
      }
    } catch (err) {
      addToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (location.state?.batchStats) {
      setStats(location.state.batchStats);
      setReviews(location.state.batchReviews || []);
      setIsBatchView(true);
      setLoading(false);
    } else {
      loadData();
    }
  }, [location.state]);

  const kpiCards = stats ? [
    { title: 'Total Reviews', value: stats.kpi.totalReviews, icon: MessageSquare, color: 'primary', trend: 12 },
    { title: 'Total Products', value: stats.kpi.totalProducts, icon: Package, color: 'violet', trend: 5 },
    { title: 'Average Rating', value: stats.kpi.avgRating, icon: Star, color: 'amber', suffix: '★' },
    { title: 'Positive Reviews', value: stats.kpi.positiveReviews, icon: ThumbsUp, color: 'emerald', trend: 8 },
    { title: 'Negative Reviews', value: stats.kpi.negativeReviews, icon: ThumbsDown, color: 'rose', trend: -3 },
    { title: 'AI Processed', value: stats.kpi.aiProcessed, icon: Cpu, color: 'sky', trend: 15 },
  ] : [];

  return (
    <div className="min-h-screen bg-transparent flex font-sans text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 pt-20 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                  {isBatchView ? (
                    <>
                      <Zap className="w-6 h-6 text-amber-400" />
                      Batch Analysis Dashboard
                    </>
                  ) : (
                    <>
                      Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
                      {user?.name?.split(' ')[0]}
                    </>
                  )}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {isBatchView
                    ? "Displaying metrics exclusively for the data you just uploaded. (Click Refresh to load global dashboard)"
                    : "Here's your feedback analytics overview for today."}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="glass-lighter text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm border border-white/10 disabled:opacity-50"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export CSV
                </button>
                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="btn-primary flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {loading
                ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                : kpiCards.map((card, i) => <KPICard key={card.title} {...card} delay={i * 0.05} />)
              }
            </div>

            {/* Row 2: Analytics Charts & Product Health */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  <><SkeletonChart /><SkeletonChart /></>
                ) : (
                  <>
                    <ReviewDistributionChart data={stats?.charts?.reviewsPerMonth} />
                    <SentimentChart data={stats?.charts?.sentimentDistribution} />
                  </>
                )}
              </div>
              <div className="xl:col-span-4 flex flex-col gap-6">
                {/* Product Health Card */}
                {loading || !stats ? (
                  <div className="card p-6 flex-1 flex flex-col justify-center animate-pulse space-y-4">
                    <div className="h-4 bg-surface-700/60 rounded w-1/3"></div>
                    <div className="h-3 bg-surface-700/40 rounded w-1/2"></div>
                    <div className="h-10 bg-surface-700/60 rounded w-2/5 mt-2"></div>
                    <div className="h-2 bg-surface-700/50 rounded-full w-full"></div>
                    <div className="h-4 bg-surface-700/40 rounded w-3/4"></div>
                  </div>
                ) : (
                  <div className="card p-6 flex-1 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                    <h3 className="text-base font-semibold text-white mb-1 relative z-10">Product Health Score</h3>
                    <p className="text-xs text-gray-400 mb-6 relative z-10">Based on rating, volume & recency</p>
                    <div className="flex items-end gap-3 mb-6 relative z-10">
                      <span className="text-5xl font-bold text-white tracking-tighter">
                        {stats?.healthScore?.score ?? 0}
                      </span>
                      <span className="text-lg text-gray-500 font-medium mb-1">/ 100</span>
                    </div>
                    <div className="h-2 w-full bg-surface-700 rounded-full overflow-hidden mb-2 relative z-10 border border-white/5">
                      <div className={`h-full ${stats && stats.healthScore?.score >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : stats && stats.healthScore?.score >= 60 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'} rounded-full`} style={{ width: `${stats?.healthScore?.score ?? 0}%` }}></div>
                    </div>
                    <p className={`text-xs font-medium relative z-10 ${stats && stats.healthScore?.score >= 80 ? 'text-emerald-400' : stats && stats.healthScore?.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {stats?.healthScore?.status || 'Good'}
                      <span className="ml-2 text-gray-400 font-normal border-l border-white/20 pl-2">Biz Priority: <strong className={stats?.businessPriority === 'Critical' ? 'text-red-500' : 'text-white'}>{stats?.businessPriority || 'Normal'}</strong></span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Aspect Sentiment & Rating Dist */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-4">
                {loading ? <SkeletonChart /> : <RatingDistributionChart data={stats?.charts?.ratingDistribution} />}
              </div>
              <div className="xl:col-span-8">
                {/* Aspect Sentiment Overview */}
                {!loading && stats?.aspectSentiment?.length > 0 && (
                  <div className="card p-6 h-full">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-semibold text-white mb-1">Aspect Sentiment Overview</h3>
                        <p className="text-xs text-gray-400">Positive sentiment % per product aspect</p>
                      </div>
                      <Link to="/analytics" className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1">
                        Full Analytics <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      {stats.aspectSentiment.slice(0, 6).map(({ aspect, positive, negative, neutral }) => {
                        const total = positive + negative + neutral || 1;
                        const pct = Math.round((positive / total) * 100);
                        const color = pct >= 70 ? 'bg-emerald-500 glow-primary' : pct >= 50 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
                        const textColor = pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400';
                        return (
                          <div key={aspect} className="p-3 bg-surface-800/50 rounded-lg border border-white/5 hover:bg-surface-800 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-200 capitalize">{aspect}</span>
                              <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-900 rounded-full overflow-hidden mb-2 border border-white/5">
                              <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[11px] text-gray-500">{positive} positive · {negative} negative</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Tables and Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8">
                {/* Recent Reviews Table */}
                <div className="card overflow-hidden h-full flex flex-col">
                  <div className="p-5 border-b border-white/5 flex items-center justify-between bg-surface-800/20">
                    <div>
                      <h3 className="text-base font-semibold text-white">Recent Reviews</h3>
                      <p className="text-xs text-gray-400 mt-1">Latest customer feedback across all products</p>
                    </div>
                    <Link to="/reviews" className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1">
                      View All <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  {loading ? (
                    <div className="p-5 space-y-3">{Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)}</div>
                  ) : reviews.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 my-auto">
                      <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-medium text-gray-300">No reviews recorded yet</p>
                      <p className="text-xs text-gray-500 mt-1">Import reviews from Amazon or upload a CSV to get started.</p>
                      <Link to="/reviews" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary-400 hover:text-primary-300 font-semibold">
                        Go to Reviews &rarr;
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                        <thead className="bg-surface-800/50 text-gray-400 uppercase text-[11px] font-semibold tracking-wider border-b border-white/5">
                          <tr>
                            <th className="px-5 py-3 font-medium">Product</th>
                            <th className="px-5 py-3 font-medium">Rating</th>
                            <th className="px-5 py-3 font-medium">Sentiment</th>
                            <th className="px-5 py-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {reviews.map(r => (
                            <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-4">
                                <p className="font-medium text-white max-w-[200px] truncate">{r.product_name}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{r.user_name}</p>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center text-yellow-400 text-xs">
                                  {'★'.repeat(r.rating)}<span className="text-gray-200">{'★'.repeat(5 - r.rating)}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`px-2.5 py-1 text-[10px] font-medium rounded-md border ${getSentimentBadge(r.sentiment)} capitalize`}>
                                  {r.sentiment}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-xs text-gray-500">
                                {new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-span-4 space-y-6">
                {/* System & DB Overview */}
                <div className="card p-5">
                  <h3 className="text-base font-semibold text-white mb-4">System Overview</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Server className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">API Status</p>
                          <p className="text-xs text-gray-400">Operational</p>
                        </div>
                      </div>
                      <span className="flex h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                          <Database className="w-4 h-4 text-primary-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Database</p>
                          <p className="text-xs text-gray-400">Connected · 24ms</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-white">1.2 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent-500/10 flex items-center justify-center border border-accent-500/20">
                          <ShieldCheck className="w-4 h-4 text-accent-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Authentication</p>
                          <p className="text-xs text-gray-400">Active</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">14 sessions</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card p-5">
                  <h3 className="text-base font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/reviews" className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-gray-300 shadow-sm">
                      <Plus className="w-4 h-4 mb-2 text-primary-400" />
                      <span className="text-[11px] font-medium">Add Review</span>
                    </Link>
                    <Link to="/amazon-import" className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-gray-300 shadow-sm">
                      <Zap className="w-4 h-4 mb-2 text-amber-400" />
                      <span className="text-[11px] font-medium">Amazon Import</span>
                    </Link>
                    <button onClick={handleExportCSV} disabled={exporting} className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-gray-300 shadow-sm disabled:opacity-50">
                      <FileText className="w-4 h-4 mb-2 text-emerald-400" />
                      <span className="text-[11px] font-medium">Export CSV</span>
                    </button>
                    {user?.role === 'admin' ? (
                      <Link to="/admin/users" className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-gray-300 shadow-sm">
                        <Users className="w-4 h-4 mb-2 text-indigo-400" />
                        <span className="text-[11px] font-medium">Manage Users</span>
                      </Link>
                    ) : (
                      <Link to="/compare" className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-gray-300 shadow-sm">
                        <Activity className="w-4 h-4 mb-2 text-sky-400" />
                        <span className="text-[11px] font-medium">Compare</span>
                      </Link>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Row 5: Timeline and Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top Products */}
              <div className="card p-6 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">Top Performing Products</h3>
                    <p className="text-xs text-gray-400 mt-1">Based on average rating & reviews</p>
                  </div>
                  <button className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">See all</button>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {[
                    { name: 'Ultra HD Smart TV 55"', rating: 4.8, revs: 342, trend: '+12%' },
                    { name: 'Noise Cancelling Headphones', rating: 4.7, revs: 890, trend: '+8%' },
                    { name: 'Ergonomic Office Chair', rating: 4.5, revs: 215, trend: '+5%' },
                    { name: 'Smartphone Pro Max', rating: 4.4, revs: 1205, trend: '-2%' },
                    { name: 'Mechanical Keyboard v2', rating: 4.2, revs: 156, trend: '+1%' }
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-800 border border-white/10 flex items-center justify-center text-gray-400 font-bold text-xs">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white truncate max-w-[150px] sm:max-w-[220px]">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-gray-300 flex items-center gap-0.5">{p.rating} <Star className="w-3 h-3 text-amber-400 fill-current" /></span>
                            <span className="text-[10px] text-gray-500">({p.revs} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full ${p.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {p.trend}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="card p-6">
                <h3 className="text-base font-semibold text-white mb-6">Recent Activity</h3>
                <div className="relative border-l border-surface-700 ml-3 space-y-6">

                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-surface-900 bg-primary-500 glow-primary shadow-sm"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">New Review Added</p>
                        <p className="text-xs text-gray-400 mt-1">Sarah left a 5-star review on "Wireless Headphones".</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">2 min ago</span>
                    </div>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-surface-900 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Batch Processing</p>
                        <p className="text-xs text-gray-400 mt-1">AI sentiment analysis completed for 1,240 reviews.</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">1 hour ago</span>
                    </div>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-surface-900 bg-accent-500 glow-accent"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">New User Login</p>
                        <p className="text-xs text-gray-400 mt-1">Admin account accessed from new IP address.</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">3 hours ago</span>
                    </div>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-surface-900 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Product Updated</p>
                        <p className="text-xs text-gray-400 mt-1">"Smartphone Pro Max" details were modified.</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">5 hours ago</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
