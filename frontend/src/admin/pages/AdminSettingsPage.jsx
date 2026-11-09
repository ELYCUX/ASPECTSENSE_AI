import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  Settings, Save, ShieldAlert, Cpu, ShoppingBag,
  Sliders, Loader2, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);

  const [settings, setSettings] = useState({
    app_info: { name: 'AspectSense AI', version: '2.0.0', maintenance_mode: false },
    review_limits: { max_upload_size_mb: 10, max_reviews_per_import: 500, rate_limit_per_minute: 60 },
    ai_settings: { default_model: 'roberta-base-absa-ate-sentiment', batch_size: 32, summarizer_provider: 'extractive', confidence_threshold: 0.5 },
    supported_marketplaces: ['amazon.in', 'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.ca', 'amazon.co.jp']
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data.data.settings) {
        setSettings(prev => ({ ...prev, ...res.data.data.settings }));
      }
      const modelRes = await api.get('/analysis/model-info');
      setModelInfo(modelRes.data.data);
    } catch (err) {
      addToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSection = async (key, value) => {
    setSaving(true);
    try {
      await api.put('/admin/settings', { key, value });
      addToast(`Configuration for ${key} updated successfully`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update setting', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="System Settings">
        <div className="py-24 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-400" />
          Loading system parameters...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="System Settings"
      subtitle="Configure enterprise review ingestion thresholds, AI model parameters, and platform health."
    >
      <div className="max-w-4xl space-y-6">

        {/* Section 1: Application Information */}
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              General Application Configuration
            </h3>
            <button
              onClick={() => handleSaveSection('app_info', settings.app_info)}
              disabled={saving}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Application Name</label>
              <input
                type="text"
                value={settings.app_info?.name || ''}
                onChange={e => setSettings(s => ({ ...s, app_info: { ...s.app_info, name: e.target.value } }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">System Version</label>
              <input
                type="text"
                value={settings.app_info?.version || ''}
                onChange={e => setSettings(s => ({ ...s, app_info: { ...s.app_info, version: e.target.value } }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.app_info?.maintenance_mode || false}
                onChange={e => setSettings(s => ({ ...s, app_info: { ...s.app_info, maintenance_mode: e.target.checked } }))}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-800"
              />
              <div>
                <span className="text-xs font-semibold text-white block">Maintenance Mode</span>
                <span className="text-[11px] text-slate-500 block">Restrict normal user access during database maintenance or model upgrades</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Review Ingestion & Upload Limits */}
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              Review Upload & Rate Limits
            </h3>
            <button
              onClick={() => handleSaveSection('review_limits', settings.review_limits)}
              disabled={saving}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Max Upload Size (MB)</label>
              <input
                type="number"
                value={settings.review_limits?.max_upload_size_mb || 10}
                onChange={e => setSettings(s => ({ ...s, review_limits: { ...s.review_limits, max_upload_size_mb: Number(e.target.value) } }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">Max Reviews per Import</label>
              <input
                type="number"
                value={settings.review_limits?.max_reviews_per_import || 500}
                onChange={e => setSettings(s => ({ ...s, review_limits: { ...s.review_limits, max_reviews_per_import: Number(e.target.value) } }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">Rate Limit (Req/min)</label>
              <input
                type="number"
                value={settings.review_limits?.rate_limit_per_minute || 60}
                onChange={e => setSettings(s => ({ ...s, review_limits: { ...s.review_limits, rate_limit_per_minute: Number(e.target.value) } }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: AI Model & NLP Parameters */}
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              Machine Learning & NLP Settings
            </h3>
            <button
              onClick={() => handleSaveSection('ai_settings', settings.ai_settings)}
              disabled={saving}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">ABSA Baseline Model</label>
              <input
                type="text"
                value={settings.ai_settings?.default_model || ''}
                onChange={e => setSettings(s => ({ ...s, ai_settings: { ...s.ai_settings, default_model: e.target.value } }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">Inference Batch Size</label>
              <input
                type="number"
                value={settings.ai_settings?.batch_size || 32}
                onChange={e => setSettings(s => ({ ...s, ai_settings: { ...s.ai_settings, batch_size: Number(e.target.value) } }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Runtime Model Status */}
          {modelInfo && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${modelInfo.absa_model_loaded ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-slate-300">Model Runtime Status:</span>
                <span className="font-semibold text-white">{modelInfo.analysis_method === 'roberta_absa' ? 'RoBERTa ABSA Active' : 'Rule-Based Fallback'}</span>
              </div>
              <span className="text-slate-500 text-[11px]">Singleton Process Mode</span>
            </div>
          )}
        </div>

        {/* Section 4: Security & API Key Safety Note */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-white">API Keys & Security Protection</p>
            <p className="text-slate-400 leading-relaxed">
              In accordance with enterprise security standards, secret credentials (such as Rainforest API and LLM API keys) are never transmitted to or displayed in the browser. They remain securely configured server-side in the backend environment.
            </p>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
