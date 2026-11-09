import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, AlertCircle, Loader2, FileText, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function CSVUploadModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState([]);
    const [summary, setSummary] = useState(null);
    const [activeTab, setActiveTab] = useState('csv'); // 'csv' or 'paste'
    const [pasteText, setPasteText] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (!selected.name.endsWith('.csv')) {
                setError('Please select a valid CSV file.');
                return;
            }
            setFile(selected);
            setError(null);

            // very basic manual parsing for preview (using papaparse is better, falling back to simple split for MVP if not installed)
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const lines = text.split('\n').filter(l => l.trim().length > 0);
                if (lines.length > 1) {
                    const headers = lines[0].split(',').map(h => h.toLowerCase().trim());
                    const previewRows = lines.slice(1, 4).map(l => {
                        // super basic csv split taking quotes roughly into account
                        const row = l.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                        return row.map(v => v.replace(/^"|"$/g, ''));
                    });
                    setPreview({ headers, rows: previewRows, count: lines.length - 1 });
                }
            };
            reader.readAsText(selected);
        }
    };

    const handleUpload = async () => {
        setLoading(true);
        setError(null);

        try {
            const rows = [];

            if (activeTab === 'csv') {
                if (!file) throw new Error("No file selected.");
                const text = await file.text();
                const rawLines = text.split('\n');
                const headers = rawLines[0].split(',').map(h => h.toLowerCase().trim());

                for (let i = 1; i < rawLines.length; i++) {
                    let line = rawLines[i].trim();
                    if (!line) continue;
                    let match = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
                    if (match) {
                        const vals = match.map(m => {
                            let v = m.startsWith(',') ? m.substring(1) : m;
                            return v.startsWith('"') ? v.slice(1, -1) : v;
                        });
                        let obj = {};
                        headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
                        rows.push({
                            product_name: obj['product_name'] || obj['product'],
                            rating: obj['rating'] || 5, // fallback rating
                            review_text: obj['review_text'] || obj['review'],
                            reviewer_name: obj['reviewer_name'] || obj['reviewer'] || 'Anonymous'
                        });
                    }
                }
            } else {
                if (!pasteText.trim()) throw new Error("Please paste some text to analyze.");

                const lines = pasteText.split('\n').filter(l => l.trim().length > 0);
                for (let line of lines) {
                    // Quick check if pipe delimited or CSV
                    const delimiter = line.includes('|') ? '|' : ',';

                    // Simple CSV split matching respecting quotes
                    let match = line.match(/(?:^|,|\|)(?:"([^"]*)"|([^,|]*))/g);
                    if (match && delimiter === ',') {
                        // Standard CSV format matching (Product, Rating, Review, Name)
                        const vals = match.map(m => {
                            let v = m.replace(/^[,|]/, '');
                            return v.startsWith('"') ? v.slice(1, -1) : v;
                        });

                        if (vals.length >= 3) {
                            rows.push({
                                product_name: vals[0] || 'General',
                                rating: parseInt(vals[1]) || 5,
                                review_text: vals[2] || '',
                                reviewer_name: vals[3] || 'Anonymous'
                            });
                        }
                    } else if (line.includes('|')) {
                        const parts = line.split('|').map(s => s.trim());
                        if (parts.length >= 3) {
                            rows.push({
                                product_name: parts[0],
                                rating: parseInt(parts[1]) || 5,
                                review_text: parts[2],
                                reviewer_name: parts[3] || 'Anonymous'
                            });
                        }
                    } else {
                        // Fallback
                        rows.push({
                            product_name: "General",
                            rating: 5,
                            review_text: line,
                            reviewer_name: "Anonymous"
                        });
                    }
                }
            }

            if (rows.length === 0) throw new Error("No valid review rows found.");

            const res = await api.post('/reviews/bulk', { reviews: rows });

            // Redirect immediately to dashboard passing the batch state
            if (onSuccess) onSuccess();
            navigate('/dashboard', {
                state: {
                    batchStats: res.data.data.batchStats,
                    batchReviews: res.data.data.batchReviews
                }
            });
            onClose();

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to import reviews. ');
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
                            <h3 className="font-semibold text-white">Bulk CSV Upload</h3>
                            <button onClick={() => { setFile(null); setPreview([]); setSummary(null); setError(null); onClose(); }} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5">
                            {summary ? (
                                <div className="text-center py-6">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-white mb-2">Import Complete</h4>
                                    <p className="text-sm text-gray-400 mb-4">{summary.message}</p>
                                    <div className="bg-white/5 p-4 rounded-lg text-left border border-white/10 mb-6">
                                        <div className="flex justify-between text-sm py-1">
                                            <span className="text-gray-400">Total Rows Extracted</span>
                                            <span className="font-medium text-white">{summary.imported}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

                                    <div className="flex border-b border-white/10 mb-4">
                                        <button
                                            onClick={() => setActiveTab('csv')}
                                            className={`px-4 py-2 text-sm font-medium border-b-2 flex-[0.5] transition-colors ${activeTab === 'csv' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                                            Upload CSV File
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('paste')}
                                            className={`px-4 py-2 text-sm font-medium border-b-2 flex-[0.5] transition-colors ${activeTab === 'paste' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
                                            Paste Multiple Reviews
                                        </button>
                                    </div>

                                    {activeTab === 'csv' ? (
                                        !file ? (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition group">
                                                <UploadCloud className="w-10 h-10 text-gray-500 group-hover:text-primary-400 mb-3" />
                                                <p className="text-sm font-medium text-gray-300">Click to upload CSV</p>
                                                <p className="text-xs text-gray-500 mt-1">Requires columns: product_name, rating, review_text</p>
                                                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between bg-surface-900 border border-white/10 p-3 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500/20 rounded text-blue-400">
                                                            <UploadCloud className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white max-w-[200px] truncate">{file.name}</p>
                                                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB • {preview.count} reviews found</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setFile(null)} className="text-xs text-red-400 hover:text-red-300 font-medium">Remove</button>
                                                </div>

                                                {preview.rows && preview.rows.length > 0 && (
                                                    <div className="border border-white/5 rounded-lg overflow-hidden text-xs">
                                                        <div className="bg-surface-900 px-3 py-2 text-gray-400 font-medium border-b border-white/5 flex">
                                                            Data Preview (First 3 rows)
                                                        </div>
                                                        <div className="overflow-x-auto max-h-[150px] p-2 bg-black/20">
                                                            {preview.rows.map((r, i) => (
                                                                <div key={i} className="py-1 text-gray-300 whitespace-nowrap truncate max-w-full">
                                                                    {r.join(" | ")}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <button onClick={handleUpload} disabled={loading}
                                                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white p-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
                                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : 'Confirm Import & Analyze'}
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-gray-400 mb-2 font-medium">Format: <code>Product Name | Rating (1-5) | Review Text | Reviewer Name</code></p>
                                                <textarea
                                                    value={pasteText}
                                                    onChange={(e) => setPasteText(e.target.value)}
                                                    rows="8"
                                                    placeholder="Awesome Shoes | 5 | These are the best shoes ever! | John Doe&#10;Bad Headphones | 1 | Sound quality is awful. | Jane Doe"
                                                    className="w-full bg-surface-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-primary-500/20 outline-none resize-none font-mono"
                                                />
                                            </div>
                                            <button onClick={handleUpload} disabled={loading || !pasteText.trim()}
                                                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white p-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
                                                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Analyze Reviews'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
