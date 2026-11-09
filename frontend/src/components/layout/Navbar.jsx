import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Layers, Menu, X, LogIn, UserPlus, LogOut, User,
  LayoutDashboard, Star, BarChart3, Info, Home, ChevronDown,
  Search, Bell, ShieldCheck
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/about', label: 'About', icon: Info },
];

const APP_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully.', 'success');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const allLinks = isAuthenticated
    ? [...NAV_LINKS, ...APP_LINKS]
    : [...NAV_LINKS];

  const pathName = location.pathname.substring(1);
  const breadcrumb = pathName ? pathName.charAt(0).toUpperCase() + pathName.slice(1) : 'Home';
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-blur shadow-sm' : 'bg-transparent border-b border-white/5'} before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-blue-500 before:via-indigo-500 before:to-purple-500`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 block md:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg glow-primary">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text hidden sm:block">AspectAI</span>
        </Link>

        {/* Left Side: Breadcrumb */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          <div className="flex items-center text-sm font-medium text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2 text-gray-600">/</span>
            <span className="text-white font-semibold">{breadcrumb}</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center justify-center gap-1 flex-1">
          {allLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${isActive(to)
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center justify-end gap-3 flex-1">
          {isAuthenticated ? (
            <>
              <div className="relative hidden lg:block">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-1.5 bg-surface-800 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all w-48 text-white placeholder-gray-500"
                />
              </div>

              <div className="hidden xl:flex items-center px-3 py-1.5 bg-surface-800 border border-white/5 rounded-lg text-sm font-medium text-gray-300">
                {currentDate}
              </div>

              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-surface-900 glow-accent"></span>
              </button>

              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-surface-800 border border-white/10 hover:bg-surface-700 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary-600 to-accent-500 flex items-center justify-center glow-primary">
                    <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <span className="text-sm text-gray-200 font-medium max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 glass rounded-xl shadow-card border border-white/10 overflow-hidden"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <div className="p-3 border-b border-white/10">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin/dashboard"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-400 hover:bg-white/5 rounded-lg transition font-medium"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Portal
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-white/5 rounded-lg transition"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm px-4 py-2 flex items-center gap-2">
                <LogIn className="w-4 h-4" /> Login
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2 flex items-center gap-2 shadow-sm">
                <UserPlus className="w-4 h-4" /> Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 overflow-hidden shadow-lg"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {allLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive(to)
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/10 mt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-rose-400 hover:bg-white/5 transition"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="btn-ghost text-sm py-3 flex items-center justify-center gap-2"><LogIn className="w-4 h-4" />Login</Link>
                    <Link to="/register" className="btn-primary text-sm py-3 flex items-center justify-center gap-2 shadow-sm"><UserPlus className="w-4 h-4" />Register</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
