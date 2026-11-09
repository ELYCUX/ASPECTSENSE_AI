import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen hero-bg grid-dots flex items-center justify-center p-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full glass border border-rose-500/20 rounded-2xl p-8 text-center shadow-2xl relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You do not have administrative permissions to access this area. This portal is restricted to authorized administrators only.
        </p>

        {user && (
          <div className="bg-surface-800/80 border border-white/5 rounded-xl p-3 mb-6 text-xs text-left">
            <p className="text-slate-500">Current User Account:</p>
            <p className="text-slate-200 font-medium truncate">{user.email}</p>
            <p className="text-slate-500 mt-1">Assigned Role: <span className="text-amber-400 font-semibold uppercase">{user.role || 'user'}</span></p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="btn-primary py-2.5 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              Return to User Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn-primary py-2.5 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Your Account
            </Link>
          )}

          <Link
            to="/"
            className="btn-ghost py-2.5 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
