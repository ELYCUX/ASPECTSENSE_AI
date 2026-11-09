import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
    Search, ShoppingBag, Star, Download, CheckCircle, AlertCircle,
    Loader2, Globe, Package, Users, Filter, ChevronDown, ChevronUp,
    Import, ArrowRight, X, Info, CheckSquare, Square, RefreshCw
} from 'lucide-react';

const VALID_DOMAINS = [
    'amazon.in', 'amazon.com', 'amazon.co.uk', 'amazon.de',
    'amazon.co.jp', 'amazon.ca', 'amazon.com.au', 'amazon.fr',
    'amazon.es', 'amazon.it'
];

const STEP_LABELS = {
    idle: null,
    validating: 'Validating URL...',
    fetching_product: 'Fetching Product Details...',
    fetching_reviews: 'Fetching Reviews...',
    importing: 'Importing Reviews...',
    analyzing: 'Analyzing with AI...',
    done: 'Import Complete!'
};

const StarRating = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <Star
                key={i}
                className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400 fill-current' : 'text-gray-600'}`}
            />
        ))}
        <span className="text-xs text-gray-400 ml-1">{rating}.0</span>
    </div>
);

export default function AmazonImportPage() {
    const { addToast } = useToast();
    const [url, setUrl] = useState('');
    const [step, setStep] = useState('idle');
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [ratingFilter, setRatingFilter] = useState(0); // 0 = all
    const [searchFilter, setSearchFilter] = useState('');
    const [importResult, setImportResult] = useState(null);
    const [error, setError] = useState('');
    const [expandedReviews, setExpandedReviews] = useState(new Set());

    const isLoading = ['validating', 'fetching_product', 'fetching_reviews', 'importing', 'analyzing'].includes(step);

    const filteredReviews = reviews.filter(r => {
        if (ratingFilter > 0 && r.rating !== ratingFilter) return false;
        if (searchFilter && !r.body.toLowerCase().includes(searchFilter.toLowerCase()) &&
            !r.reviewer_name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
        return true;
    });

    const handleFetch = async () => {
        if (!url.trim()) {
            setError('Please enter an Amazon product URL.');
            return;
        }
        setError('');
        setProduct(null);
        setReviews([]);
        setSelected(new Set());
        setImportResult(null);
        setStep('validating');

        try {
            setStep('fetching_product');
            const res = await api.post('/amazon/fetch', { url: url.trim() });
            const data = res.data.data;
            setProduct(data.product);
            setReviews(data.reviews || []);
            // Auto-select all reviews
            const allIds = new Set((data.reviews || []).map((_, idx) => idx));
            setSelected(allIds);
            setStep('done');
            if (res.data.cached) addToast('Product loaded from cache', 'info');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to fetch Amazon product.';
            setError(msg);
            setStep('idle');
        }
    };

    const handleSelectAll = () => {
        if (selected.size === filteredReviews.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filteredReviews.map((_, idx) =>
                reviews.indexOf(filteredReviews[idx])
            )));
        }
    };

    const toggleSelect = (idx) => {
        const realIdx = reviews.indexOf(filteredReviews[idx]);
        setSelected(prev => {
            const n = new Set(prev);
            if (n.has(realIdx)) n.delete(realIdx);
            else n.add(realIdx);
            return n;
        });
    };

    const handleImport = async () => {
        if (selected.size === 0) {
            addToast('Please select at least one review.', 'warning');
            return;
        }
        setStep('importing');
        try {
            const selectedReviews = Array.from(selected).map(i => reviews[i]);
            const res = await api.post('/amazon/import', {
                url: url.trim(),
                reviews: selectedReviews,
                product: product,
                createProduct: true
            });
            setImportResult(res.data.data);
            setStep('done');
            addToast(`${res.data.data.imported} reviews imported successfully!`, 'success');
        } catch (err) {
            const msg = err.response?.data?.message || 'Import failed.';
            addToast(msg, 'error');
            setStep('done');
        }
    };

    const toggleExpand = (idx) => {
        setExpandedReviews(prev => {
            const n = new Set(prev);
            if (n.has(idx)) n.delete(idx);
            else n.add(idx);
            return n;
        });
    };

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'text-emerald-400';
        if (rating === 3) return 'text-amber-400';
        return 'text-rose-400';
    };

    return (
        <div className="min-h-screen bg-transparent flex font-sans text-gray-200">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 p-6 pt-20 overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* Page Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                                    <ShoppingBag className="w-6 h-6 text-amber-400" />
                                    Import Product Reviews
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">
                                    Discover what customers really think about products by analyzing their Amazon reviews.
                                </p>
                            </div>
                        </div>

                        {/* URL Input Card */}
                        <div className="card p-6">
                            <h2 className="text-base font-semibold text-white mb-4">Amazon Product URL</h2>
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={e => { setUrl(e.target.value); setError(''); }}
                                        onKeyDown={e => e.key === 'Enter' && !isLoading && handleFetch()}
                                        placeholder="https://www.amazon.in/dp/XXXXXXXXXX"
                                        className="input pl-10 pr-4"
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    onClick={handleFetch}
                                    disabled={isLoading || !url.trim()}
                                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                    {isLoading ? 'Fetching...' : 'Fetch Product & Reviews'}
                                </button>
                            </div>

                            {/* Progress indicator */}
                            {isLoading && (
                                <div className="mt-4 flex items-center gap-3 text-sm text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                                    <span>{STEP_LABELS[step]}</span>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-3 flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Supported domains */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {VALID_DOMAINS.slice(0, 6).map(d => (
                                    <span key={d} className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                                        {d}
                                    </span>
                                ))}
                                <span className="text-[10px] text-gray-500">+ more</span>
                            </div>
                        </div>

                        {/* Product Preview */}
                        <AnimatePresence>
                            {product && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card p-6"
                                >
                                    <h2 className="text-base font-semibold text-white mb-4">Product Preview</h2>
                                    <div className="flex gap-6">
                                        {product.image_url && (
                                            <img
                                                src={product.image_url}
                                                alt={product.title}
                                                className="w-24 h-24 object-contain rounded-lg bg-white/5 border border-white/10 p-2 shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white text-lg leading-tight line-clamp-2">
                                                {product.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                {product.brand && (
                                                    <span className="text-sm text-gray-400">
                                                        Brand: <strong className="text-gray-200">{product.brand}</strong>
                                                    </span>
                                                )}
                                                {product.rating && (
                                                    <div className="flex items-center gap-1">
                                                        <StarRating rating={Math.round(product.rating)} />
                                                        <span className="text-xs text-gray-500">({product.ratings_total?.toLocaleString()} ratings)</span>
                                                    </div>
                                                )}
                                                {product.category && (
                                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                                                        {product.category.split(' › ').pop()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg px-4 py-2 text-center">
                                                    <p className="text-2xl font-bold text-white">{reviews.length}</p>
                                                    <p className="text-xs text-gray-400">Reviews Available</p>
                                                </div>
                                                {product.price && (
                                                    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-center">
                                                        <p className="text-lg font-bold text-white">{product.currency} {product.price}</p>
                                                        <p className="text-xs text-gray-400">Current Price</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Import Result Banner */}
                        <AnimatePresence>
                            {importResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card p-5 border-emerald-500/30 bg-emerald-500/5"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        <h3 className="font-semibold text-white">Import Completed</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Imported', value: importResult.imported, color: 'text-emerald-400' },
                                            { label: 'Analyzed', value: importResult.analyzed, color: 'text-primary-400' },
                                            { label: 'Duplicates Skipped', value: importResult.duplicates, color: 'text-amber-400' },
                                            { label: 'Errors', value: importResult.errors, color: 'text-rose-400' },
                                        ].map(item => (
                                            <div key={item.label} className="bg-white/5 rounded-lg p-3 text-center">
                                                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                                                <p className="text-xs text-gray-400">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reviews Table */}
                        <AnimatePresence>
                            {reviews.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card overflow-hidden"
                                >
                                    {/* Toolbar */}
                                    <div className="p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base font-semibold text-white">Customer Review Preview</h2>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {selected.size} of {reviews.length} reviews selected
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Search */}
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                                <input
                                                    type="text"
                                                    value={searchFilter}
                                                    onChange={e => setSearchFilter(e.target.value)}
                                                    placeholder="Search reviews..."
                                                    className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 outline-none focus:border-primary-500/50 w-40"
                                                />
                                            </div>
                                            {/* Rating filter */}
                                            <select
                                                value={ratingFilter}
                                                onChange={e => setRatingFilter(Number(e.target.value))}
                                                className="bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 px-2 py-1.5 outline-none"
                                            >
                                                <option value={0}>All Ratings</option>
                                                {[5, 4, 3, 2, 1].map(r => (
                                                    <option key={r} value={r}>{r} Stars</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Select all */}
                                    <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                        <button
                                            onClick={handleSelectAll}
                                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                                        >
                                            {selected.size === filteredReviews.length && filteredReviews.length > 0 ? (
                                                <CheckSquare className="w-4 h-4 text-primary-400" />
                                            ) : (
                                                <Square className="w-4 h-4" />
                                            )}
                                            {selected.size === filteredReviews.length && filteredReviews.length > 0 ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <span className="text-xs text-gray-500">{filteredReviews.length} reviews shown</span>
                                    </div>

                                    {/* Reviews list */}
                                    <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                                        {filteredReviews.map((review, idx) => {
                                            const realIdx = reviews.indexOf(review);
                                            const isSelected = selected.has(realIdx);
                                            const isExpanded = expandedReviews.has(idx);
                                            const bodyPreview = review.body.length > 200 && !isExpanded
                                                ? review.body.slice(0, 200) + '...'
                                                : review.body;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelected ? 'bg-primary-500/5' : ''}`}
                                                    onClick={() => toggleSelect(idx)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Checkbox */}
                                                        <div className="mt-0.5">
                                                            {isSelected ? (
                                                                <CheckSquare className="w-4 h-4 text-primary-400 shrink-0" />
                                                            ) : (
                                                                <Square className="w-4 h-4 text-gray-600 shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <span className="text-sm font-medium text-white">{review.reviewer_name}</span>
                                                                <StarRating rating={review.rating} />
                                                                {review.verified_purchase && (
                                                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                                                        Verified
                                                                    </span>
                                                                )}
                                                                {review.review_date && (
                                                                    <span className="text-[10px] text-gray-500">{review.review_date}</span>
                                                                )}
                                                            </div>
                                                            {review.title && (
                                                                <p className="text-sm font-medium text-gray-200 mb-1">{review.title}</p>
                                                            )}
                                                            <p className="text-sm text-gray-400 leading-relaxed">{bodyPreview}</p>
                                                            {review.body.length > 200 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(idx); }}
                                                                    className="text-xs text-primary-400 hover:text-primary-300 mt-1 flex items-center gap-1"
                                                                >
                                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                                    {isExpanded ? 'Show less' : 'Read more'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Import button */}
                                    {!importResult && (
                                        <div className="p-5 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                                            <p className="text-sm text-gray-400">
                                                {selected.size} review{selected.size !== 1 ? 's' : ''} selected for import
                                            </p>
                                            <button
                                                onClick={handleImport}
                                                disabled={selected.size === 0 || isLoading}
                                                className="btn-primary flex items-center gap-2"
                                            >
                                                {step === 'importing' ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                Import Selected Reviews
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Info card when idle */}
                        {step === 'idle' && !product && (
                            <div className="card p-8 text-center">
                                <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-base font-medium text-white mb-2">How It Works</h3>
                                <div className="max-w-md mx-auto space-y-3 text-sm text-gray-400">
                                    {[
                                        'Paste an Amazon product URL above',
                                        'We fetch product details and available reviews via Rainforest API',
                                        'Preview and select reviews to import',
                                        'Reviews are analyzed with AI (SpaCy + RoBERTa ABSA)',
                                        'Results appear in your dashboard automatically',
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold flex items-center justify-center shrink-0">
                                                {i + 1}
                                            </span>
                                            <span>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
