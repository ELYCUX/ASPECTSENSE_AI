import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Search, Filter, ShieldCheck, UserCheck, UserX,
  MoreVertical, Eye, Edit3, Key, Trash2, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, X, Loader2
} from 'lucide-react';

export default function UserManagementPage() {
  const { addToast } = useToast();
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [newRole, setNewRole] = useState('user');
  const [newStatus, setNewStatus] = useState('active');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        search,
        role: roleFilter,
        status: statusFilter
      });
      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data.users || []);
      setTotal(res.data.data.pagination.total || 0);
      setTotalPages(res.data.data.pagination.totalPages || 1);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Status update
  const handleConfirmStatus = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}/status`, { status: newStatus });
      addToast(`User account status updated to ${newStatus}`, 'success');
      setStatusModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Status update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Role update
  const handleConfirmRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}/role`, { role: newRole });
      addToast(`User role updated to ${newRole}`, 'success');
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Role assignment failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit profile
  const handleConfirmEdit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, editForm);
      addToast('User profile updated successfully', 'success');
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Send password reset
  const handleSendPasswordReset = async (u) => {
    try {
      await api.post(`/admin/users/${u.id}/reset-password`);
      addToast(`Password reset instructions dispatched for ${u.email}`, 'info');
    } catch (err) {
      addToast(err.response?.data?.message || 'Password reset failed', 'error');
    }
  };

  // Delete user
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      addToast(`Account for ${selectedUser.email} deleted`, 'success');
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle="Inspect, manage permissions, activate or suspend platform user accounts."
    >
      {/* Top Controls: Search, Filters */}
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="analyst">Analyst</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>

          <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">
            Total: <strong className="text-white">{total}</strong>
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0b1220] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3 px-4 font-semibold">User ID</th>
                <th className="py-3 px-4 font-semibold">User Details</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold text-center">Products</th>
                <th className="py-3 px-4 font-semibold text-center">Reviews</th>
                <th className="py-3 px-4 font-semibold">Registration Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading users database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/30 text-slate-300 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 font-semibold">#{u.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{u.name}</p>
                          <p className="text-slate-400 text-[11px] truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role || 'user');
                          setRoleModalOpen(true);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          u.role === 'admin'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="Click to change role"
                      >
                        {u.role?.toUpperCase()}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewStatus(u.account_status === 'suspended' ? 'active' : 'suspended');
                          setStatusModalOpen(true);
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          u.account_status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                        title="Click to toggle status"
                      >
                        {u.account_status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-300">{u.products_count ?? 0}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-300">{u.reviews_count ?? 0}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/users/${u.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="View User Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setEditForm({ name: u.name, email: u.email });
                            setEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSendPasswordReset(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                          title="Send Password Reset"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentAdmin?.id && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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

      {/* MODAL 1: Account Status Confirmation */}
      <AnimatePresence>
        {statusModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  {newStatus === 'suspended' ? 'Suspend Account' : 'Activate Account'}
                </h3>
                <button onClick={() => setStatusModalOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to change the status of <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email}) to <strong className={newStatus === 'suspended' ? 'text-rose-400' : 'text-emerald-400'}>{newStatus.toUpperCase()}</strong>?
                {newStatus === 'suspended' && ' The user will immediately be barred from logging in or using any protected API.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatus}
                  disabled={actionLoading}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition ${
                    newStatus === 'suspended' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionLoading ? 'Updating...' : `Confirm ${newStatus}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Role Assignment */}
      <AnimatePresence>
        {roleModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Assign Role</h3>
                <button onClick={() => setRoleModalOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Assign a role for <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email}):
              </p>

              <div className="space-y-2">
                {['user', 'admin', 'analyst'].map(r => (
                  <label
                    key={r}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer text-xs transition ${
                      newRole === r
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    <span className="uppercase">{r}</span>
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={newRole === r}
                      onChange={() => setNewRole(r)}
                      className="hidden"
                    />
                    {newRole === r && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRoleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRole}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
                >
                  {actionLoading ? 'Assigning...' : 'Save Role'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Edit Profile */}
      <AnimatePresence>
        {editModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Edit Profile</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEdit}
                  disabled={actionLoading || !editForm.name || !editForm.email}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Delete User Confirmation */}
      <AnimatePresence>
        {deleteModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-rose-500/30 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete User Account</h3>
                  <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email})? Products and reviews created by this user will be detached to protect historical analytics.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition"
                >
                  {actionLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
