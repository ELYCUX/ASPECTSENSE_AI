import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { SkeletonRow } from '../components/ui/SkeletonCard';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import ReviewFormModal from '../components/ui/ReviewFormModal';
import CSVUploadModal from '../components/ui/CSVUploadModal';
import QualityScoreModal from '../components/ui/QualityScoreModal';
import {
  Search, Filter, ChevronLeft, ChevronRight, Star,
  ThumbsUp, ThumbsDown, Minus, MessageSquare, RefreshCw, X
} from 'lucide-react';

const SENTIMENT_OPTIONS = ['all', 'positive', 'negative', 'neutral'];

export default function ReviewsPage() {
  const { addToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, page, search });
      if (sentiment !== 'all') params.set('sentiment', sentiment);
      const res = await api.get(`/reviews?${params}`);
      setReviews(res.data.data.reviews);
      setPagination(res.data.data.pagination);
    } catch {
      addToast('Failed to load reviews.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, sentiment]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search, sentiment]);

  const SentimentIcon = ({ s }) => {
    if (s === 'positive') return <ThumbsUp className="w-3.5 h-3.5 text-green-600" />;
    if (s === 'negative') return <ThumbsDown className="w-3.5 h-3.5 text-red-600" />;
    return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-transparent flex font-sans text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 pt-20 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Customer Reviews</h1>
                <p className="text-gray-400 text-sm">Browse, search, and filter all product reviews</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsCsvOpen(true)} className="px-4 py-2 bg-surface-800 border border-white/10 hover:bg-white/5 text-gray-300 rounded-lg text-sm font-medium transition shadow-sm">
                  Upload CSV
                </button>
                <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition shadow-sm border border-primary-500/50">
                  + Add Review
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 card p-4 rounded-xl shadow-sm border border-white/5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews, products, reviewers..."
                  className="w-full pl-10 pr-10 py-2 bg-surface-800 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-white placeholder-gray-500"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sentiment Filter */}
              <div className="flex gap-2 flex-wrap items-center">
                {SENTIMENT_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSentiment(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize border ${sentiment === s
                      ? s === 'positive' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-sm'
                        : s === 'negative' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-sm'
                          : s === 'neutral' ? 'bg-white/10 border-white/20 text-gray-300 shadow-sm'
                            : 'bg-primary-500/20 border-primary-500/30 text-primary-400 shadow-sm'
                      : 'bg-surface-800 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>

              <button onClick={load} className="hidden sm:flex glass-lighter border border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors items-center gap-2 shadow-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Stats Bar */}
            {!loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageSquare className="w-4 h-4" />
                <span>
                  Showing <span className="text-gray-900 font-semibold">{reviews.length}</span> of{' '}
                  <span className="text-gray-900 font-semibold">{pagination.total?.toLocaleString()}</span> reviews
                  {search && <> matching "<span className="text-blue-600 font-medium">{search}</span>"</>}
                </span>
              </div>
            )}

            {/* Table */}
            <div className="card shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4">{Array(LIMIT).fill(0).map((_, i) => <SkeletonRow key={i} />)}</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-white font-medium text-base">No reviews found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                    <thead className="bg-surface-800/50 text-gray-400 uppercase text-[11px] font-semibold tracking-wider border-b border-white/5">
                      <tr>
                        {['#', 'Product', 'Reviewer', 'Rating', 'Review', 'Sentiment', 'Aspects', 'Date'].map(h => (
                          <th key={h} className="px-5 py-3 first:w-12">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reviews.map((r, idx) => (
                        <tr
                          key={r.id}
                          className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        >
                          <td className="px-5 py-4 text-gray-500 font-medium text-xs">{(page - 1) * LIMIT + idx + 1}</td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-white max-w-[160px] truncate">{r.product_name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{r.brand}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-xs shrink-0 border border-primary-500/30">
                                {r.user_name[0].toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-300 max-w-[100px] truncate">{r.user_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex text-yellow-400 text-xs">
                              {'★'.repeat(r.rating)}<span className="text-gray-200">{'★'.repeat(5 - r.rating)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-600 truncate max-w-[200px]">{r.body}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 w-fit border ${r.sentiment === 'positive' ? 'bg-green-50 text-green-700 border-green-200' :
                              r.sentiment === 'negative' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                              <SentimentIcon s={r.sentiment} />
                              <span className="capitalize">{r.sentiment}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {r.aspects && (
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {Object.entries(r.aspects).slice(0, 3).map(([k, v]) => (
                                  <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium capitalize border ${v === 'positive' ? 'bg-green-50 text-green-700 border-green-100' :
                                    v === 'negative' ? 'bg-red-50 text-red-700 border-red-100' :
                                      'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>{k}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500">
                            {new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">
                  Page <span className="text-gray-900 font-semibold">{page}</span> of <span className="text-gray-900 font-semibold">{pagination.totalPages}</span>
                </p>
                <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pg = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-8 h-8 rounded-md text-sm font-medium transition ${pg === page ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modals */}
      <ReviewFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={() => { load(); }} />
      <CSVUploadModal isOpen={isCsvOpen} onClose={() => setIsCsvOpen(false)} onSuccess={() => { load(); }} />
      <QualityScoreModal isOpen={!!expanded} onClose={() => setExpanded(null)} reviewId={expanded} />

    </div>
  );
}
