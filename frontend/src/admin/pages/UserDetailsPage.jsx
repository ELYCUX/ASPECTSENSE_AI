import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft, UserCheck, UserX, Shield, Key, Package,
  MessageSquare, ShoppingBag, History, Calendar, Mail,
  Clock, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';

export default function UserDetailsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setData(res.data.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load user details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [userId]);

  const user = data?.user;

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.account_status === 'suspended' ? 'active' : 'suspended';
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${user.id}/status`, { status: newStatus });
      addToast(`User account status updated to ${newStatus}`, 'success');
      fetchDetails();
    } catch (err) {
      addToast(err.response?.data?.message || 'Status change failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user) return;
    try {
      await api.post(`/admin/users/${user.id}/reset-password`);
      addToast(`Password reset instructions dispatched for ${user.email}`, 'info');
    } catch (err) {
      addToast(err.response?.data?.message || 'Password reset failed', 'error');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="User Profile">
        <div className="py-24 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
          Loading user record...
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="User Not Found">
        <div className="p-8 text-center space-y-4">
          <p className="text-slate-400">The requested user does not exist.</p>
          <Link to="/admin/users" className="btn-primary inline-flex items-center gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const products = data?.products || [];
  const reviews = data?.reviews || [];
  const imports = data?.imports || [];
  const logs = data?.activity_logs || [];

  return (
    <AdminLayout
      title={`User: ${user.name}`}
      subtitle={`Detailed profile, activity footprint, and administrative actions for user #${user.id}`}
    >
      {/* Back Link */}
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to User Management
        </Link>
      </div>

      {/* User Header Profile Card */}
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-primary-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                user.role === 'admin'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {user.role?.toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                user.account_status === 'suspended'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {user.account_status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Registered: {new Date(user.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Last Login: {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              user.account_status === 'suspended'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
            }`}
          >
            {user.account_status === 'suspended' ? (
              <><UserCheck className="w-3.5 h-3.5" /> Activate Account</>
            ) : (
              <><UserX className="w-3.5 h-3.5" /> Suspend Account</>
            )}
          </button>

          <button
            onClick={handleSendPasswordReset}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" /> Reset Password
          </button>
        </div>
      </div>

      {/* Activity Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Products Created', value: products.length, icon: Package, color: 'text-violet-400' },
          { label: 'Reviews Uploaded', value: reviews.length, icon: MessageSquare, color: 'text-amber-400' },
          { label: 'Amazon Imports', value: imports.length, icon: ShoppingBag, color: 'text-emerald-400' },
          { label: 'Audit Events', value: logs.length, icon: History, color: 'text-indigo-400' },
        ].map((item, i) => (
          <div key={i} className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">{item.label}</p>
              <p className="text-xl font-bold text-white mt-0.5">{item.value}</p>
            </div>
            <item.icon className={`w-5 h-5 ${item.color}`} />
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex gap-2">
        {[
          { key: 'products', label: `Products (${products.length})`, icon: Package },
          { key: 'reviews', label: `Reviews (${reviews.length})`, icon: MessageSquare },
          { key: 'imports', label: `Amazon Imports (${imports.length})`, icon: ShoppingBag },
          { key: 'logs', label: `Activity History (${logs.length})`, icon: History },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Products */}
      {activeTab === 'products' && (
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden p-4">
          {products.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No products created by this user yet</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {products.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-slate-400 text-[11px]">{p.category} • {p.brand}</p>
                  </div>
                  <span className="text-slate-500 text-[11px]">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden p-4">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No reviews uploaded by this user yet</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {reviews.map(r => (
                <div key={r.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{r.product_name || `Product #${r.product_id}`}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                      r.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {r.sentiment?.toUpperCase()} ({r.rating}★)
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Imports */}
      {activeTab === 'imports' && (
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden p-4">
          {imports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No Amazon imports by this user yet</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {imports.map(imp => (
                <div key={imp.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{imp.product_title || `ASIN: ${imp.asin}`}</p>
                    <p className="text-slate-400 text-[11px]">
                      Marketplace: {imp.marketplace} • {imp.imported_count} reviews imported
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400">
                    {imp.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden p-4">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No activity log entries for this user</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {logs.map((log, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded font-semibold mr-2">
                      {log.action}
                    </span>
                    <span className="text-slate-300">{log.description}</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
