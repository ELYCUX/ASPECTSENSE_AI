import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import { RefreshCw, Search, ShieldCheck, ThumbsUp, ThumbsDown, Star } from 'lucide-react';

export default function ComparePage() {
    const { addToast } = useToast();
    const [products, setProducts] = useState([]);
    const [p1, setP1] = useState('');
    const [p2, setP2] = useState('');
    const [loading, setLoading] = useState(false);
    const [comparison, setComparison] = useState(null);

    useEffect(() => {
        api.get('/products?limit=100').then(res => setProducts(res.data.data.products)).catch(() => { });
    }, []);

    const handleCompare = async () => {
        if (!p1 || !p2) { addToast('Select two products to compare', 'error'); return; }
        if (p1 === p2) { addToast('Select two different products', 'error'); return; }
        setLoading(true);
        try {
            const res = await api.get(`/products/compare?p1=${p1}&p2=${p2}`);
            setComparison(res.data.data);
        } catch {
            addToast('Failed to compare products', 'error');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-transparent flex font-sans text-gray-200">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 p-6 pt-20 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">

                        <div className="mb-2">
                            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Competitor Comparison</h1>
                            <p className="text-gray-400 text-sm">Compare Business Priority and Customer feedback between two products</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 card p-4 rounded-xl shadow-sm border border-white/5 items-end">
                            <div className="relative flex-1 w-full">
                                <label className="block text-sm text-gray-400 mb-1">Product A</label>
                                <select value={p1} onChange={e => setP1(e.target.value)} className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option value="">Select product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="hidden sm:flex text-gray-500 font-bold items-center justify-center pb-2 px-2">VS</div>
                            <div className="relative flex-1 w-full">
                                <label className="block text-sm text-gray-400 mb-1">Product B</label>
                                <select value={p2} onChange={e => setP2(e.target.value)} className="w-full bg-surface-800 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option value="">Select product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleCompare} disabled={loading} className="btn-primary w-full sm:w-auto mt-4 sm:mt-0 px-6 py-2 h-[42px] flex items-center justify-center gap-2 text-sm">
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Compare'}
                            </button>
                        </div>

                        {comparison && comparison.length === 2 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 border border-white/5">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center invisible">Metric</div>
                                    <div className="text-center bg-surface-800/50 p-4 border-b border-primary-500/20 rounded-t-xl"><h3 className="font-bold text-white text-lg">{comparison[0].name}</h3><span className="text-xs text-gray-400">{comparison[0].brand}</span></div>
                                    <div className="text-center bg-surface-800/50 p-4 border-b border-accent-500/20 rounded-t-xl"><h3 className="font-bold text-white text-lg">{comparison[1].name}</h3><span className="text-xs text-gray-400">{comparison[1].brand}</span></div>

                                    <div className="flex items-center justify-center text-sm font-semibold text-gray-400 bg-surface-800/20 py-3 rounded">Health Score</div>
                                    <div className="text-center font-bold text-2xl flex justify-center items-center py-3 bg-surface-800/10">
                                        <span className={comparison[0].healthScore > comparison[1].healthScore ? 'text-green-500 glow-primary' : 'text-gray-300'}>{comparison[0].healthScore}</span>
                                    </div>
                                    <div className="text-center font-bold text-2xl flex justify-center items-center py-3 bg-surface-800/10">
                                        <span className={comparison[1].healthScore > comparison[0].healthScore ? 'text-green-500 glow-primary' : 'text-gray-300'}>{comparison[1].healthScore}</span>
                                    </div>

                                    <div className="flex items-center justify-center text-sm font-semibold text-gray-400 bg-surface-800/20 py-3 rounded">Average Rating</div>
                                    <div className="text-center font-bold text-lg flex justify-center items-center py-3 gap-1 bg-surface-800/10">
                                        <span className={comparison[0].avgRating > comparison[1].avgRating ? 'text-amber-400' : 'text-gray-300'}>{comparison[0].avgRating.toFixed(1)} <Star className="w-4 h-4 inline fill-current" /></span>
                                    </div>
                                    <div className="text-center font-bold text-lg flex justify-center items-center py-3 gap-1 bg-surface-800/10">
                                        <span className={comparison[1].avgRating > comparison[0].avgRating ? 'text-amber-400' : 'text-gray-300'}>{comparison[1].avgRating.toFixed(1)} <Star className="w-4 h-4 inline fill-current" /></span>
                                    </div>

                                    <div className="flex items-center justify-center text-sm font-semibold text-gray-400 bg-surface-800/20 py-3 rounded">Total Reviews</div>
                                    <div className="text-center text-gray-300 font-semibold flex justify-center items-center py-3 bg-surface-800/10">{comparison[0].reviewCount}</div>
                                    <div className="text-center text-gray-300 font-semibold flex justify-center items-center py-3 bg-surface-800/10">{comparison[1].reviewCount}</div>

                                    <div className="flex items-center justify-center text-sm font-semibold text-gray-400 bg-surface-800/20 py-3 rounded">Positive Feedback %</div>
                                    <div className="text-center font-bold text-lg flex justify-center items-center flex-col py-3 bg-surface-800/10">
                                        <span className={comparison[0].positivePct > comparison[1].positivePct ? 'text-green-500' : 'text-gray-300'}>{comparison[0].positivePct.toFixed(1)}%</span>
                                        <div className="w-16 h-1 mt-1 bg-gray-700 rounded overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${comparison[0].positivePct}%` }}></div></div>
                                    </div>
                                    <div className="text-center font-bold text-lg flex justify-center items-center flex-col py-3 bg-surface-800/10">
                                        <span className={comparison[1].positivePct > comparison[0].positivePct ? 'text-green-500' : 'text-gray-300'}>{comparison[1].positivePct.toFixed(1)}%</span>
                                        <div className="w-16 h-1 mt-1 bg-gray-700 rounded overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${comparison[1].positivePct}%` }}></div></div>
                                    </div>

                                    <div className="flex items-center justify-center text-sm font-semibold text-gray-400 bg-surface-800/20 py-3 rounded border-b border-white/5">Negative Feedback %</div>
                                    <div className="text-center font-bold text-lg flex justify-center items-center flex-col py-3 bg-surface-800/10 border-b border-white/5">
                                        <span className={comparison[0].negativePct < comparison[1].negativePct ? 'text-green-500' : (comparison[0].negativePct > comparison[1].negativePct ? 'text-red-500' : 'text-gray-300')}>{comparison[0].negativePct.toFixed(1)}%</span>
                                        <div className="w-16 h-1 mt-1 bg-gray-700 rounded overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${comparison[0].negativePct}%` }}></div></div>
                                    </div>
                                    <div className="text-center font-bold text-lg flex justify-center items-center flex-col py-3 bg-surface-800/10 border-b border-white/5">
                                        <span className={comparison[1].negativePct < comparison[0].negativePct ? 'text-green-500' : (comparison[1].negativePct > comparison[0].negativePct ? 'text-red-500' : 'text-gray-300')}>{comparison[1].negativePct.toFixed(1)}%</span>
                                        <div className="w-16 h-1 mt-1 bg-gray-700 rounded overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${comparison[1].negativePct}%` }}></div></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
