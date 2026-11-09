import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layers, Mail, Lock, LogIn, Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import AnimatedBlobs from '../components/ui/AnimatedBlobs';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { user, token } = res.data.data;
      login(user, token);
      addToast(`Welcome back, ${user.name}!`, 'success');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg grid-dots flex items-center justify-center px-4 relative overflow-hidden">
      <AnimatedBlobs />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl glow-ring">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg glow-primary mb-3">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to your AspectAI account</p>
          </div>

          {/* Demo creds */}
          <div className="mb-6 p-3 rounded-xl bg-primary-500/08 border border-primary-500/20 text-xs text-primary-300 flex flex-col gap-1">
            <p className="font-semibold text-primary-400">Demo Credentials</p>
            <p>Email: <span className="font-mono">demo@aspectai.com</span></p>
            <p>Password: <span className="font-mono">password123</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Email</label>
              <div className="relative">
                {/* <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /> */}
                <input
                  type="email"
                  name="email"
                  required
                  className="input pl-10"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Password</label>
              <div className="relative">
                {/* <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /> */}
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  required
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 font-semibold hover:text-primary-300 transition">
              Create one <ArrowRight className="w-3.5 h-3.5 inline" />
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
