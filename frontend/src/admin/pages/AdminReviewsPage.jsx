import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Search, Trash2, Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function AdminReviewsPage() {
  const { addToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reviews?page=${page}&limit=15&search=${search}&sentiment=${sentiment}`);
      setReviews(res.data.data.reviews || []);
      setTotal(res.data.data.pagination.total || 0);
      setTotalPages(res.data.data.pagination.totalPages || 1);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, sentiment]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete review #${id}?`)) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      addToast('Review deleted successfully', 'success');
      fetchReviews();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete review', 'error');
    }
  };

  return (
    <AdminLayout
      title="Review Moderation"
      subtitle="Inspect, search, and moderate customer reviews across all products."
    >
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchReviews(); }} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search review text or author..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={sentiment}
            onChange={e => { setSentiment(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
          <span className="text-xs text-slate-400">Total: <strong className="text-white">{total}</strong></span>
        </div>
      </div>

      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3 px-4 font-semibold">Review</th>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Author</th>
                <th className="py-3 px-4 font-semibold text-center">Rating</th>
                <th className="py-3 px-4 font-semibold text-center">Sentiment</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No reviews found.</td>
                </tr>
              ) : (
                reviews.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30 text-slate-300 transition">
                    <td className="py-3 px-4 max-w-md">
                      <p className="line-clamp-2 text-slate-200">{r.body}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Source: {r.source || 'manual'} • {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                      {r.product_name || `Product #${r.product_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.user_name || 'Anonymous'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                        {r.rating} <Star className="w-3 h-3 fill-current" />
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        r.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {r.sentiment?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
