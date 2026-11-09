import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/axios';
import {
  ShieldCheck, LayoutDashboard, Users, Package, MessageSquare,
  ShoppingBag, BarChart3, Cpu, History, Settings, Bell,
  LogOut, ExternalLink, Search, ChevronDown, Check, X,
  Menu
} from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
  { to: '/admin/imports', icon: ShoppingBag, label: 'Amazon Imports' },
  { to: '/admin/ai-jobs', icon: Cpu, label: 'AI Processing Jobs' },
  { to: '/admin/activity-logs', icon: History, label: 'Activity Logs' },
  { to: '/admin/settings', icon: Settings, label: 'System Settings' },
];

export default function AdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch {
      // optional
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      addToast('All notifications marked as read', 'info');
    } catch {
      // error
    }
  };

  const handleLogout = () => {
    logout();
    addToast('Signed out of Admin Portal.', 'info');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-200 flex font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#0b1220] border-r border-slate-800/80 sticky top-0 h-screen z-30">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-primary-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">AspectSense</span>
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
              ADMIN
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Administration
          </p>

          {ADMIN_LINKS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <p className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Portals
            </p>
            <Link
              to="/dashboard"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <span className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                User Portal
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                Live
              </span>
            </Link>
          </div>
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-[#090f1b]">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#0b1220]/90 backdrop-blur border-b border-slate-800/80 sticky top-0 z-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">{title || 'Admin Portal'}</h1>
              {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Switch to User Portal */}
            <Link
              to="/dashboard"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              Switch to User View
            </Link>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 relative transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0b1220]" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs ${n.is_read ? 'opacity-60' : 'bg-indigo-500/05'}`}
                          >
                            <p className="font-semibold text-slate-200">{n.title}</p>
                            <p className="text-slate-400 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-slate-600 mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-primary-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs"
                  >
                    <div className="p-3 border-b border-slate-800/80">
                      <p className="font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-slate-400 truncate text-[11px] mt-0.5">{user?.email}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                        ROLE: {user?.role?.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-1 space-y-1">
                      <Link
                        to="/admin/settings"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Settings className="w-3.5 h-3.5" /> System Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, x: -240 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -240 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-[#0b1220] border-r border-slate-800 z-50 flex flex-col p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-white text-base">AspectSense Admin</span>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {ADMIN_LINKS.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
