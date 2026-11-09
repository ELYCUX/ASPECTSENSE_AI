import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Cpu, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function AdminAIJobsPage() {
  const { addToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/ai-jobs?page=${page}&limit=15`);
      setJobs(res.data.data.jobs || []);
      setTotal(res.data.data.pagination.total || 0);
      setTotalPages(res.data.data.pagination.totalPages || 1);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load AI jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  return (
    <AdminLayout
      title="AI Processing Jobs"
      subtitle="Monitor aspect-based review analysis, summary generation, and model queue health."
    >
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Background Processing Tasks
          </h3>
          <span className="text-xs text-slate-400">Total Jobs: <strong className="text-white">{total}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3 px-4 font-semibold">Job ID</th>
                <th className="py-3 px-4 font-semibold">Job Type</th>
                <th className="py-3 px-4 font-semibold">Target Product</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Progress</th>
                <th className="py-3 px-4 font-semibold">Details / Error</th>
                <th className="py-3 px-4 font-semibold text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading AI processing jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No active or historical AI background jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map(j => (
                  <tr key={j.id} className="hover:bg-slate-800/30 text-slate-300 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">#{j.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                        {j.job_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                      {j.product_name || `Product #${j.product_id || '—'}`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        j.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        j.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {j.status?.toUpperCase() || 'QUEUED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 mx-auto overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${j.total > 0 ? Math.round((j.progress / j.total) * 100) : (j.status === 'completed' ? 100 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {j.progress || 0} / {j.total || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-400 truncate">
                      {j.error_message ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {j.error_message}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Normal execution</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {j.created_at ? new Date(j.created_at).toLocaleString() : '—'}
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
