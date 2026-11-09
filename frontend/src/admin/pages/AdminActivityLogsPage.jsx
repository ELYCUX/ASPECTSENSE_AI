import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { History, Search, ChevronLeft, ChevronRight, Loader2, Shield } from 'lucide-react';

const ACTIONS = [
  'ADMIN_LOGIN',
  'USER_SUSPENDED',
  'USER_ACTIVATED',
  'ROLE_CHANGED',
  'USER_UPDATED',
  'USER_DELETED',
  'PASSWORD_RESET_INITIATED',
  'CONFIGURATION_CHANGED',
  'PRODUCT_DELETED',
  'REVIEW_DELETED'
];

export default function AdminActivityLogsPage() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/activity-logs?page=${page}&limit=20&action=${actionFilter}&search=${search}`);
      setLogs(res.data.data.logs || []);
      setTotal(res.data.data.pagination.total || 0);
      setTotalPages(res.data.data.pagination.totalPages || 1);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <AdminLayout
      title="Activity Logs & Audit Trail"
      subtitle="Immutable enterprise audit records of administrative changes, security events, and user management actions."
    >
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, description, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Action Types</option>
            {ACTIONS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">Total Entries: <strong className="text-white">{total}</strong></span>
        </div>
      </div>

      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Administrator</th>
                <th className="py-3 px-4 font-semibold">Target Record</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No activity logs matching criteria.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 text-slate-300 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{log.admin_email}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.target_type ? `${log.target_type} #${log.target_id || ''}` : '—'}
                    </td>
                    <td className="py-3 px-4 max-w-sm text-slate-300">{log.description}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.ip_address || '—'}</td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
