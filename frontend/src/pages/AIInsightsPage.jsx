import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
    Brain, Star, ThumbsUp, ThumbsDown, Minus, RefreshCw,
    Loader2, Package, ChevronDown, Info, Sparkles, BarChart2,
    TrendingUp, TrendingDown, CheckCircle, AlertCircle
} from 'lucide-react';

const SentimentBar = ({ positive = 0, negative = 0, neutral = 0 }) => {
    const total = positive + negative + neutral || 1;
    const posP = Math.round((positive / total) * 100);
    const negP = Math.round((negative / total) * 100);
    const neuP = 100 - posP - negP;
    return (
        <div className="flex h-2 w-full rounded-full overflow-hidden">
            <div className="bg-emerald-500" style={{ width: `${posP}%` }} />
            <div className="bg-rose-500" style={{ width: `${negP}%` }} />
            <div className="bg-gray-500" style={{ width: `${neuP}%` }} />
        </div>
    );
};

const AspectCard = ({ aspect, positive = 0, negative = 0, neutral = 0 }) => {
    const total = positive + negative + neutral || 1;
    const pct = Math.round((positive / total) * 100);
    const color = pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400';
    const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-200">{aspect}</span>
                <span className={`text-sm font-bold ${color}`}>{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
            <SentimentBar positive={positive} negative={negative} neutral={neutral} />
            <p className="text-[10px] text-gray-500 mt-1">
                {positive}↑ {negative}↓ {neutral}→ (total {total})
            </p>
        </div>
    );
};

export default function AIInsightsPage() {
    const { addToast } = useToast();
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [summary, setSummary] = useState(null);
    const [aspectData, setAspectData] = useState([]);
    const [modelInfo, setModelInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products?limit=100');
                setProducts(res.data.data.products || []);
            } catch (err) {
                addToast('Failed to load products', 'error');
            } finally {
                setLoadingProducts(false);
            }
        };
        const fetchModelInfo = async () => {
            try {
                const res = await api.get('/analysis/model-info');
                setModelInfo(res.data.data);
            } catch { /* optional */ }
        };
        fetchProducts();
        fetchModelInfo();
    }, []);

    const loadInsights = async (productId, forceRegenerate = false) => {
        if (!productId) return;
        setLoading(true);
        setSummary(null);
        setAspectData([]);

        try {
            // Load aspect data
            const aspectRes = await api.get(`/reviews/aspect-sentiment?productId=${productId}`);
            setAspectData(aspectRes.data.data || []);

            // Load or generate summary
            if (forceRegenerate) {
                setGenerating(true);
                const genRes = await api.post(`/analysis/summarize/${productId}`);
                setSummary(genRes.data.data);
                addToast('AI summary generated!', 'success');
            } else {
                try {
                    const summRes = await api.get(`/analysis/summary/${productId}`);
                    setSummary(summRes.data.data);
                } catch {
                    // Not generated yet — show empty state
                    setSummary(null);
                }
            }
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to load insights', 'error');
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    };

    const handleProductChange = (e) => {
        const id = e.target.value;
        setSelectedProductId(id);
        if (id) loadInsights(id);
    };

    return (
        <div className="min-h-screen bg-transparent flex font-sans text-gray-200">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 p-6 pt-20 overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                                    <Brain className="w-6 h-6 text-violet-400" />
                                    AI Insights
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">
                                    AI-powered per-product analysis using SpaCy aspect extraction and RoBERTa sentiment.
                                </p>
                            </div>
                            {modelInfo && (
                                <div className="hidden sm:flex items-center gap-2 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                    <div className={`w-2 h-2 rounded-full ${modelInfo.absa_model_loaded ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    <span className="text-gray-400">
                                        {modelInfo.analysis_method === 'roberta_absa' ? 'RoBERTa ABSA Active' : 'Rule-Based Mode'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Product Selector */}
                        <div className="card p-5">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Select Product</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <select
                                        value={selectedProductId}
                                        onChange={handleProductChange}
                                        disabled={loadingProducts}
                                        className="input pl-10 pr-10 appearance-none"
                                    >
                                        <option value="">— Select a product —</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.brand ? `· ${p.brand}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                                {selectedProductId && (
                                    <button
                                        onClick={() => loadInsights(selectedProductId, true)}
                                        disabled={loading || generating}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {generating ? 'Generating...' : 'Generate Summary'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Loading state */}
                        {loading && (
                            <div className="card p-12 flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-400" />
                                <p className="text-gray-400 text-sm">
                                    {generating ? 'Generating AI summary...' : 'Loading insights...'}
                                </p>
                            </div>
                        )}

                        {/* No product selected */}
                        {!selectedProductId && !loading && (
                            <div className="card p-12 text-center">
                                <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-base font-medium text-white mb-2">No Product Selected</h3>
                                <p className="text-sm text-gray-400">
                                    Select a product to view its AI-powered review analysis and insights.
                                </p>
                            </div>
                        )}

                        {/* Insights Content */}
                        {!loading && selectedProductId && (
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* AI Summary */}
                                    {summary ? (
                                        <div className="card p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-violet-400" />
                                                    AI Summary
                                                </h2>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                                                        {summary.is_llm_generated ? summary.model_used : 'Extractive Summary'}
                                                    </span>
                                                    <button
                                                        onClick={() => loadInsights(selectedProductId, true)}
                                                        disabled={generating}
                                                        className="btn-ghost py-1 px-2 text-xs flex items-center gap-1"
                                                    >
                                                        <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                                                        Regenerate
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Overall */}
                                            {summary.summary_text && (
                                                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4 mb-4">
                                                    <p className="text-sm text-gray-300 leading-relaxed">{summary.summary_text}</p>
                                                </div>
                                            )}

                                            {/* Highlights grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Positive */}
                                                {summary.positive_highlights?.length > 0 && (
                                                    <div>
                                                        <h3 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-1">
                                                            <ThumbsUp className="w-3.5 h-3.5" /> Positive Highlights
                                                        </h3>
                                                        <ul className="space-y-1.5">
                                                            {(Array.isArray(summary.positive_highlights)
                                                                ? summary.positive_highlights
                                                                : JSON.parse(summary.positive_highlights || '[]')
                                                            ).map((item, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Negative */}
                                                {summary.negative_highlights?.length > 0 && (
                                                    <div>
                                                        <h3 className="text-sm font-medium text-rose-400 mb-2 flex items-center gap-1">
                                                            <ThumbsDown className="w-3.5 h-3.5" /> Negative Highlights
                                                        </h3>
                                                        <ul className="space-y-1.5">
                                                            {(Array.isArray(summary.negative_highlights)
                                                                ? summary.negative_highlights
                                                                : JSON.parse(summary.negative_highlights || '[]')
                                                            ).map((item, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recommendations */}
                                            {summary.recommendations?.length > 0 && (
                                                <div className="mt-4 p-4 bg-primary-500/5 border border-primary-500/20 rounded-lg">
                                                    <h3 className="text-sm font-medium text-primary-400 mb-2 flex items-center gap-1">
                                                        <TrendingUp className="w-3.5 h-3.5" /> Recommendations
                                                    </h3>
                                                    <ul className="space-y-1.5">
                                                        {(Array.isArray(summary.recommendations)
                                                            ? summary.recommendations
                                                            : JSON.parse(summary.recommendations || '[]')
                                                        ).map((item, i) => (
                                                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                                <span className="text-primary-400 font-bold shrink-0">{i + 1}.</span>
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedProductId && !loading && (
                                        <div className="card p-8 text-center border-dashed">
                                            <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                            <h3 className="text-base font-medium text-white mb-2">No Summary Yet</h3>
                                            <p className="text-sm text-gray-400 mb-4">
                                                Click "Generate Summary" to create an AI-powered analysis for this product.
                                            </p>
                                            <button
                                                onClick={() => loadInsights(selectedProductId, true)}
                                                className="btn-primary mx-auto flex items-center gap-2"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Generate Now
                                            </button>
                                        </div>
                                    )}

                                    {/* Aspect Sentiment */}
                                    {aspectData.length > 0 && (
                                        <div className="card p-6">
                                            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                                <BarChart2 className="w-4 h-4 text-primary-400" />
                                                Aspect-Level Sentiment Analysis
                                            </h2>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {aspectData.map(item => (
                                                    <AspectCard key={item.aspect} {...item} />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Positive</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> Negative</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-500 rounded-full"></span> Neutral</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty aspects state */}
                                    {aspectData.length === 0 && !loading && selectedProductId && (
                                        <div className="card p-8 text-center">
                                            <BarChart2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                            <h3 className="text-base font-medium text-white mb-2">No Aspect Data</h3>
                                            <p className="text-sm text-gray-400">
                                                This product has no reviews with aspect analysis yet. Add some reviews to see insights.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
