import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Layers, LayoutDashboard, Star, BarChart3, Info, Home,
  LogOut, ChevronLeft, ChevronRight, Cpu, TrendingUp, ShieldCheck,
  ShoppingBag, Brain
} from 'lucide-react';

const LINKS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/import', icon: ShoppingBag, label: 'Import Amazon' },
  { to: '/ai-insights', icon: Brain, label: 'AI Insights' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/compare', icon: Layers, label: 'Compare' },
  { to: '/about', icon: Info, label: 'About' },
];

const STATS = [
  { icon: Cpu, label: 'AI Model', value: 'ABSA v1' },
  { icon: TrendingUp, label: 'Accuracy', value: '94.2%' },
  { icon: ShieldCheck, label: 'Status', value: 'Online' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('Signed out successfully.', 'success');
    navigate('/');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="shrink-0 h-screen sticky top-0 flex flex-col glass border-r border-white/5 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/5">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center glow-primary">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-base text-white whitespace-nowrap gradient-text"
            >
              AspectAI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1"
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        {LINKS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* Admin Portal Link if Admin */}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 mt-2 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? 'Admin Portal' : undefined}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="whitespace-nowrap"
                >
                  Admin Portal
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        )}

        {/* System stats */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 rounded-xl glass-lighter border border-white/5 space-y-2"
          >
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">System</p>
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
                </div>
                <span className="text-gray-200 font-semibold">{value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </nav>

      {/* User + Collapse */}
      <div className="p-3 border-t border-white/5">
        {!collapsed && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5 mb-2 px-2"
          >
            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-r from-primary-600 to-accent-500 flex items-center justify-center glow-primary">
              <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.role}</p>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleLogout}
          title="Sign Out"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-rose-400 hover:bg-white/5 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-2 w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
