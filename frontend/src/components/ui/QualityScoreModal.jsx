import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Info } from 'lucide-react';
import api from '../../api/axios';

export default function QualityScoreModal({ isOpen, onClose, reviewId }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && reviewId) {
            setLoading(true);
            api.get(`/reviews/${reviewId}/quality-score`)
                .then(res => setData(res.data.data))
                .catch(err => setError('Failed to load quality score'))
                .finally(() => setLoading(false));
        } else {
            setData(null);
            setError(null);
        }
    }, [isOpen, reviewId]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-surface-800 border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b border-white/5">
                            <h3 className="font-semibold text-white">Review Quality Score</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5">
                            {loading ? <div className="py-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div> :
                                error ? <p className="text-red-400 text-sm text-center">{error}</p> :
                                    data && (
                                        <div className="flex flex-col items-center">
                                            <div className="relative mb-6">
                                                <svg className="w-32 h-32 transform -rotate-90">
                                                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-surface-900" />
                                                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={351.8} strokeDashoffset={351.8 - (351.8 * data.score) / 100} className={data.score >= 80 ? "text-emerald-500" : data.score >= 50 ? "text-amber-500" : "text-rose-500"} />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">{data.score}</div>
                                            </div>

                                            <div className="w-full bg-surface-900 rounded-lg p-4 border border-white/5">
                                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Score Breakdown</h4>
                                                <div className="space-y-3">
                                                    {data.details.map((desc, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                                            <span>{desc}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                            }
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
