import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { Package, Search, Trash2, Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function AdminProductsPage() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/products?page=${page}&limit=12&search=${search}`);
      setProducts(res.data.data.products || []);
      setTotal(res.data.data.pagination.total || 0);
      setTotalPages(res.data.data.pagination.totalPages || 1);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}" and all its reviews?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      addToast(`Product "${name}" deleted`, 'success');
      fetchProducts();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  return (
    <AdminLayout
      title="Product Management"
      subtitle="View and moderate all products across user catalogs and shared inventories."
    >
      {/* Search Header */}
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchProducts(); }} className="relative w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </form>
        <span className="text-xs text-slate-400">Total Products: <strong className="text-white">{total}</strong></span>
      </div>

      {/* Products Table */}
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3 px-4 font-semibold">Product Name</th>
                <th className="py-3 px-4 font-semibold">Category & Brand</th>
                <th className="py-3 px-4 font-semibold">Owner</th>
                <th className="py-3 px-4 font-semibold text-center">Reviews</th>
                <th className="py-3 px-4 font-semibold text-center">Avg Rating</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No products found.</td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 text-slate-300 transition">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-500">ID #{p.id} {p.asin && `• ASIN: ${p.asin}`}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <span>{p.category}</span>
                      <span className="text-slate-500 ml-1">({p.brand || 'Generic'})</span>
                    </td>
                    <td className="py-3 px-4">
                      {p.owner_name ? (
                        <div>
                          <p className="text-xs text-slate-200">{p.owner_name}</p>
                          <p className="text-[10px] text-slate-500">{p.owner_email}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                          Shared / Demo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-200">{p.review_count ?? 0}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        {p.avg_rating ? p.avg_rating.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Product"
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

        {/* Pagination */}
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
