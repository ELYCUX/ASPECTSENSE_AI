import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { ShoppingBag, ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react';

export default function AdminImportsPage() {
  const { addToast } = useToast();
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchImports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/imports?page=${page}&limit=15`);
      setImports(res.data.data.imports || []);
      setTotal(res.data.data.pagination.total || 0);
      setTotalPages(res.data.data.pagination.totalPages || 1);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load imports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, [page]);

  return (
    <AdminLayout
      title="Amazon Import History"
      subtitle="Track all Amazon products and reviews imported across user accounts."
    >
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Product Link Import Logs
          </h3>
          <span className="text-xs text-slate-400">Total Imports: <strong className="text-white">{total}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3 px-4 font-semibold">ASIN</th>
                <th className="py-3 px-4 font-semibold">Product Title</th>
                <th className="py-3 px-4 font-semibold">Marketplace</th>
                <th className="py-3 px-4 font-semibold text-center">Imported</th>
                <th className="py-3 px-4 font-semibold text-center">Duplicates</th>
                <th className="py-3 px-4 font-semibold">Imported By</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading import records...
                  </td>
                </tr>
              ) : imports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">No Amazon imports recorded yet.</td>
                </tr>
              ) : (
                imports.map(imp => (
                  <tr key={imp.id} className="hover:bg-slate-800/30 text-slate-300 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                      {imp.asin || '—'}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-white truncate">{imp.product_title || 'Amazon Product'}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{imp.marketplace}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">{imp.imported_count ?? 0}</td>
                    <td className="py-3 px-4 text-center font-medium text-amber-400">{imp.duplicate_count ?? 0}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {imp.imported_by_name || imp.imported_by_email || 'System'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {imp.status || 'completed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {imp.created_at ? new Date(imp.created_at).toLocaleString() : '—'}
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
