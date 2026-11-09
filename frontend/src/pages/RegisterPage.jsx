import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layers, Mail, Lock, User, UserPlus, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import AnimatedBlobs from '../components/ui/AnimatedBlobs';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      addToast('Passwords do not match.', 'error');
      return;
    }
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      const { user, token } = res.data.data;
      login(user, token);
      addToast(`Account created! Welcome, ${user.name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed.', 'error');
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
        <div className="glass rounded-2xl p-8 shadow-2xl glow-ring">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg glow-primary mb-3">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Create Account</h1>
            <p className="text-sm text-slate-400 mt-1">Join AspectAI — Free forever</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Full Name</label>
              <div className="relative">
                {/* <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /> */}
                <input type="text" name="name" required className="input pl-10" placeholder="John Doe" value={form.name} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Email</label>
              <div className="relative">
                {/* <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /> */}
                <input type="email" name="email" required className="input pl-10" placeholder="your@email.com" value={form.email} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Password</label>
              <div className="relative">
                {/* <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /> */}
                <input type={showPw ? 'text' : 'password'} name="password" required className="input pl-10 pr-10" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Confirm Password</label>
              <div className="relative">
                {/* <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /> */}
                <input type={showPw ? 'text' : 'password'} name="confirm" required className="input pl-10" placeholder="Repeat password" value={form.confirm} onChange={handleChange} />
              </div>
            </div>

            {/* Password strength */}
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => {
                  const len = form.password.length;
                  const strength = len >= 12 ? 4 : len >= 8 ? 3 : len >= 6 ? 2 : len >= 3 ? 1 : 0;
                  return (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= strength ? (strength >= 3 ? 'bg-emerald-500' : strength >= 2 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-white/10'
                      }`} />
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">
                {form.password.length >= 12 ? 'Strong password' : form.password.length >= 8 ? 'Good password' : form.password.length >= 6 ? 'Weak password' : form.password.length > 0 ? 'Too short' : ''}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus className="w-4 h-4" /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 font-semibold hover:text-primary-300 transition">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
