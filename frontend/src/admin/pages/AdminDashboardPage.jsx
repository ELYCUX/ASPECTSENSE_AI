import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  Users, UserCheck, UserX, Package, MessageSquare,
  ShoppingBag, Cpu, CheckCircle, ArrowRight,
  RefreshCw, Activity, Eye
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchDashboard = async (force = false) => {
    setLoading(true);
    try {
      const url = force ? '/admin/dashboard?refresh=true' : '/admin/dashboard';
      const res = await api.get(url);
      setData(res.data.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load admin stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const kpis = data?.kpis || {};
  const isInitialLoading = loading && !data;

  return (
    <AdminLayout
      title="System Overview"
      subtitle="Enterprise system-wide metrics, user accounts, and platform health."
    >
      {/* Top Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Platform Health & Metrics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time statistics sourced directly from Supabase PostgreSQL.</p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Stats'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Users',
            value: kpis.totalUsers,
            icon: Users,
            color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20',
            link: '/admin/users'
          },
          {
            label: 'Active Users',
            value: kpis.activeUsers,
            icon: UserCheck,
            color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20',
            link: '/admin/users?status=active'
          },
          {
            label: 'Suspended Users',
            value: kpis.suspendedUsers,
            icon: UserX,
            color: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/20',
            link: '/admin/users?status=suspended'
          },
          {
            label: 'Total Products',
            value: kpis.totalProducts,
            icon: Package,
            color: 'from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/20',
            link: '/admin/products'
          },
          {
            label: 'Total Reviews',
            value: kpis.totalReviews,
            icon: MessageSquare,
            color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20',
            link: '/admin/reviews'
          },
          {
            label: 'Amazon Imported',
            value: kpis.importedReviews,
            icon: ShoppingBag,
            color: 'from-indigo-500/20 to-cyan-500/10 text-indigo-400 border-indigo-500/20',
            link: '/admin/imports'
          },
          {
            label: 'Analyzed with AI',
            value: kpis.analyzedReviews,
            icon: CheckCircle,
            color: 'from-teal-500/20 to-emerald-500/10 text-teal-400 border-teal-500/20',
            link: '/admin/reviews'
          },
          {
            label: 'Pending / Failed Jobs',
            value: `${kpis.pendingJobs ?? 0} / ${kpis.failedJobs ?? 0}`,
            icon: Cpu,
            color: 'from-slate-500/20 to-gray-500/10 text-slate-300 border-slate-500/20',
            link: '/admin/ai-jobs'
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              to={item.link}
              className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} border bg-[#0d1527] hover:scale-[1.02] transition-transform flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">{item.label}</span>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex items-baseline justify-between">
                {isInitialLoading ? (
                  <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
                ) : (
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {item.value !== undefined ? item.value : '0'}
                  </span>
                )}
                <span className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Users & Recent Imports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Recent Registered Users
            </h3>
            <Link to="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60 overflow-hidden">
            {isInitialLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse py-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-800 rounded w-24" />
                      <div className="h-2.5 bg-slate-800/60 rounded w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (data?.recentUsers || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No registered users found</div>
            ) : (
              (data?.recentUsers || []).map(u => (
                <div key={u.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {u.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      u.role === 'admin'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {u.role?.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      u.account_status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {u.account_status || 'active'}
                    </span>
                    <Link
                      to={`/admin/users/${u.id}`}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Amazon Imports */}
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              Recent Product Imports
            </h3>
            <Link to="/admin/imports" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60 overflow-hidden">
            {isInitialLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between animate-pulse py-2">
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="h-3 bg-slate-800 rounded w-48" />
                      <div className="h-2.5 bg-slate-800/60 rounded w-28" />
                    </div>
                    <div className="h-4 bg-slate-800 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : (data?.recentImports || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No Amazon imports recorded yet</div>
            ) : (
              (data?.recentImports || []).map(imp => (
                <div key={imp.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-medium text-white truncate">{imp.product_title || `ASIN: ${imp.asin}`}</p>
                    <p className="text-[11px] text-slate-400">
                      Marketplace: <span className="text-slate-300">{imp.marketplace}</span> • {imp.imported_count} reviews
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {imp.status || 'completed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Audit Trail (Recent Activity Logs) */}
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Administrative Audit Trail
          </h3>
          <Link to="/admin/activity-logs" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            View full log
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold">Admin Account</th>
                <th className="py-2.5 px-3 font-semibold">Description</th>
                <th className="py-2.5 px-3 font-semibold">IP Address</th>
                <th className="py-2.5 px-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isInitialLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Loading real-time admin metrics...</span>
                    </div>
                  </td>
                </tr>
              ) : (data?.recentLogs || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No activity logs recorded yet
                  </td>
                </tr>
              ) : (
                (data?.recentLogs || []).map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 text-slate-300">
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{log.admin_email}</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{log.description}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{log.ip_address || '—'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
