import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';

export default function ReviewFormModal({ isOpen, onClose, onSuccess }) {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({ productId: '', reviewerName: '', rating: '5', reviewText: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successResult, setSuccessResult] = useState(null);

    useEffect(() => {
        if (isOpen) {
            api.get('/products?limit=100').then((res) => setProducts(res.data.data.products || [])).catch(() => { });
        } else {
            // block reset when closing
            setTimeout(() => {
                setFormData({ productId: '', reviewerName: '', rating: '5', reviewText: '' });
                setSuccessResult(null);
                setError(null);
            }, 300);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Duplicate check
            const dupRes = await api.post('/reviews/check-duplicate', { reviewText: formData.reviewText });
            const dupStatus = dupRes.data?.data?.status;
            if (dupStatus === 'Duplicate') {
                if (!window.confirm('This looks exactly like an existing review. Continue anyway?')) {
                    setLoading(false);
                    return;
                }
            } else if (dupStatus === 'Possible Duplicate') {
                if (!window.confirm('This looks very similar to an existing review. Continue anyway?')) {
                    setLoading(false);
                    return;
                }
            }

            const res = await api.post('/reviews', formData);
            setSuccessResult(res.data.data.analysis);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-surface-800 border border-white/10 rounded-xl overflow-hidden w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b border-white/5">
                            <h3 className="font-semibold text-white">Add Review</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5">
                            {successResult ? (
                                <div className="text-center py-6">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-white mb-2">Review Submitted Successfully</h4>
                                    <div className="bg-white/5 p-4 rounded-lg mt-4 text-left border border-white/10">
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Detected Aspects:</p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {Object.keys(successResult).length === 0 ? <span className="text-gray-400 text-sm">None</span> :
                                                Object.keys(successResult).join(', ')
                                            }
                                        </div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Aspect Sentiment:</p>
                                        <div className="space-y-1">
                                            {Object.entries(successResult).map(([k, v]) => (
                                                <p key={k} className="text-sm text-gray-300">{k} <span className="text-gray-500">-&gt;</span> <span className={`capitalize ${v.sentiment === 'positive' ? 'text-green-400' : v.sentiment === 'negative' ? 'text-red-400' : 'text-gray-400'}`}>{v.sentiment}</span></p>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Analysis Method:</span>
                                            <span className="text-xs font-medium text-blue-400">Rule-Based Analysis</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Product</label>
                                        <select required value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })}
                                            className="w-full bg-surface-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-primary-500/20 outline-none">
                                            <option value="">Select a product...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Reviewer Name</label>
                                            <input required type="text" value={formData.reviewerName} onChange={e => setFormData({ ...formData, reviewerName: e.target.value })}
                                                className="w-full bg-surface-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-primary-500/20 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Rating</label>
                                            <select required value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })}
                                                className="w-full bg-surface-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-primary-500/20 outline-none">
                                                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Review Text</label>
                                        <textarea required rows="4" value={formData.reviewText} onChange={e => setFormData({ ...formData, reviewText: e.target.value })}
                                            placeholder="Write the review..."
                                            className="w-full bg-surface-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"></textarea>
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white p-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
                                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing & Saving...</> : 'Submit Review'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
