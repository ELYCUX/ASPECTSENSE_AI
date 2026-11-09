import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AnimatedBlobs from '../components/ui/AnimatedBlobs';
import {
  Layers, BarChart3, ShieldCheck, Zap, Star, MessageSquare,
  TrendingUp, Database, Server, Globe, ArrowRight, CheckCircle,
  Users, Award, Clock, Target, Brain, Search, PieChart,
  Smartphone, Headphones, Laptop, Camera, Package, Mail,
  ChevronRight, Cpu, Sparkles, Eye
} from 'lucide-react';

/* ============================
   SECTION WRAPPER w/ InView
   ============================ */
const Section = ({ children, id, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section id={id} ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </section>
  );
};

/* ============================
   ANIMATED COUNTER
   ============================ */
const Counter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.floor(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ============================
   TYPED HEADLINE
   ============================ */
const TYPED_WORDS = ['Battery Life', 'Display Quality', 'Camera Performance', 'Build Quality', 'Price Value', 'Delivery Speed'];
const TypedWord = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TYPED_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4 }}
        className="gradient-text"
      >
        {TYPED_WORDS[idx]}
      </motion.span>
    </AnimatePresence>
  );
};

/* ============================
   FEATURES DATA
   ============================ */
const FEATURES = [
  { icon: Brain, color: 'text-primary-400 bg-primary-500/15', title: 'Aspect Extraction', desc: 'Automatically identifies product aspects like Battery, Camera, Display from raw review text.' },
  { icon: PieChart, color: 'text-violet-400 bg-violet-500/15', title: 'Sentiment Classification', desc: 'Classifies each aspect as Positive, Negative, or Neutral with high precision.' },
  { icon: BarChart3, color: 'text-sky-400 bg-sky-500/15', title: 'Visual Analytics', desc: 'Interactive charts and dashboards to visualize sentiment trends over time.' },
  { icon: Search, color: 'text-amber-400 bg-amber-500/15', title: 'Review Search & Filter', desc: 'Full-text search and multi-dimensional filtering across thousands of reviews.' },
  { icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/15', title: 'Trend Analysis', desc: 'Track how sentiment for each product aspect evolves month over month.' },
  { icon: ShieldCheck, color: 'text-rose-400 bg-rose-500/15', title: 'Secure JWT Auth', desc: 'Role-based access with bcrypt hashing and JWT tokens for secure authentication.' },
];

/* ============================
   WORKFLOW STEPS
   ============================ */
const WORKFLOW = [
  { step: '01', icon: Database, title: 'Collect Reviews', desc: 'Scrape or import product reviews from Amazon, Flipkart, and other e-commerce platforms via CSV or API.' },
  { step: '02', icon: Brain, title: 'Extract Aspects', desc: 'ABSA model identifies mentioned product aspects (Battery, Camera, Display, etc.) from each review.' },
  { step: '03', icon: PieChart, title: 'Classify Sentiment', desc: 'Each extracted aspect is classified as Positive, Negative, or Neutral using fine-tuned BERT models.' },
  { step: '04', icon: BarChart3, title: 'Visualize Insights', desc: 'Aggregated aspect sentiment is presented in an interactive dashboard with charts and exportable reports.' },
];

/* ============================
   TECHNOLOGIES
   ============================ */
const TECHS = [
  { name: 'React', color: '#61DAFB', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { name: 'Vite', color: '#646CFF', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { name: 'Tailwind CSS', color: '#38BDF8', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
  { name: 'Framer Motion', color: '#FF4D6D', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { name: 'Node.js', color: '#8CC84B', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { name: 'Express.js', color: '#FFFFFF', bg: 'bg-white/05', border: 'border-white/10' },
  { name: 'PostgreSQL', color: '#336791', bg: 'bg-blue-700/10', border: 'border-blue-700/20' },
  { name: 'JWT', color: '#F05138', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { name: 'Chart.js', color: '#FF6384', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { name: 'Recharts', color: '#8884D8', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
  { name: 'bcrypt', color: '#94A3B8', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  { name: 'Axios', color: '#5A29E4', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

/* ============================
   TEAM
   ============================ */
const TEAM = [
  { name: 'Gopal Krushna Panda', role: 'Full Stack Developer', avatar: 'GP', color: 'from-primary-500 to-accent-500', bio: 'React & Node.js specialist, architected the full MVC backend and dashboard UI.' },
  { name: 'Sradhanjali behera', role: 'ML Engineer', avatar: 'SB', color: 'from-violet-500 to-pink-500', bio: 'Designed the ABSA pipeline, fine-tuned BERT models for aspect extraction.' },
  { name: 'Priyadarshani Raout', role: 'DataBase Engineer', avatar: 'PR', color: 'from-sky-500 to-primary-500', bio: 'Created the database system, tables, and handle user list .' },
  // { name: 'Sneha Kapoor',  role: 'Data Engineer',         avatar: 'SK', color: 'from-emerald-500 to-sky-500',   bio: 'Built the review ingestion pipeline and PostgreSQL schema with 40K seed reviews.' },
];

/* ============================
   STATS
   ============================ */
const STATS = [
  { value: 15000, suffix: '+', label: 'Reviews Processed', icon: MessageSquare, color: 'text-primary-400' },
  { value: 15, suffix: '+', label: 'Product Categories', icon: Package, color: 'text-violet-400' },
  { value: 94, suffix: '%', label: 'Model Accuracy', icon: Target, color: 'text-emerald-400' },
  { value: 8, suffix: '', label: 'Aspect Categories', icon: Layers, color: 'text-amber-400' },
];

/* ============================
   MAIN PAGE
   ============================ */
export default function LandingPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const handleContact = (e) => {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setContactSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-surface-900 text-slate-200 overflow-x-hidden">
      <Navbar />

      {/* ======================== HERO ======================== */}
      <section id="home" className="relative min-h-screen hero-bg grid-dots flex items-center pt-16 overflow-hidden">
        <AnimatedBlobs />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary-500/20 text-xs font-semibold text-primary-400 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Aspect-Based Sentiment Analysis Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4"
            >
              Analyze Product<br />
              <TypedWord />{' '}
              <br className="hidden sm:block" />
              <span className="text-slate-300">with AI Precision</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg"
            >
              AspectAI automatically analyzes thousands of customer reviews, extracts product aspects, and summarizes sentiment — giving you actionable insights to improve your products.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              {/* <Link to="/dashboard" className="btn-ghost flex items-center gap-2 px-6 py-3 text-sm font-semibold">
                <Eye className="w-4 h-4" /> View Demo
              </Link> */}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex items-center gap-6 mt-8 pt-6 border-t border-white/06"
            >
              {[['94.2%', 'Accuracy'], ['15K+', 'Reviews'], ['8', 'Aspect Types']].map(([v, l]) => (
                <div key={l}>
                  <p className="text-xl font-bold text-white">{v}</p>
                  <p className="text-xs text-slate-500">{l}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative hidden lg:block"
          >
            <div className="relative glass rounded-2xl p-6 shadow-2xl glow-ring">
              {/* Mock dashboard card */}
              <div className="mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">AspectAI Dashboard</p>
                  <p className="text-xs text-slate-400">Samsung Galaxy S24 Ultra</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Camera', pct: 88, color: 'bg-emerald-500' },
                  { label: 'Battery', pct: 72, color: 'bg-primary-500' },
                  { label: 'Build', pct: 91, color: 'bg-violet-500' },
                  { label: 'Display', pct: 85, color: 'bg-sky-500' },
                  { label: 'Performance', pct: 79, color: 'bg-amber-500' },
                  { label: 'Price', pct: 48, color: 'bg-rose-500' },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="bg-surface-700 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 mb-1.5">{label}</p>
                    <p className="text-sm font-bold text-white mb-2">{pct}%</p>
                    <div className="progress-bar">
                      <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-emerald-500/80" style={{ flex: 7 }} />
                <div className="flex-1 h-2 rounded-full bg-slate-500/50" style={{ flex: 2 }} />
                <div className="flex-1 h-2 rounded-full bg-rose-500/60" style={{ flex: 1 }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>71% Positive</span><span>16% Neutral</span><span>13% Negative</span>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 glass-lighter border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300">94.2% Accurate</span>
              </motion.div>
              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 glass-lighter border border-primary-500/30 rounded-xl px-3 py-2 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-primary-400" />
                <span className="text-xs font-semibold text-primary-300">Real-time AI</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================== ABOUT ======================== */}
      <Section id="about" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">About the Project</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-3 mb-5 leading-tight">
              Turning Raw Reviews into<br /><span className="gradient-text">Actionable Intelligence</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-5">
              AspectAI is a 5th semester academic project built to demonstrate the power of Aspect-Based Sentiment Analysis (ABSA) in a real-world e-commerce context. Unlike traditional sentiment analysis that gives a single positive/negative score, ABSA identifies <em>which specific feature</em> customers are talking about.
            </p>
            <p className="text-slate-400 leading-relaxed mb-6">
              A phone might get 3.5 stars overall, but have a 92% positive sentiment for Camera while getting 31% negative sentiment for Battery. This granular insight is invaluable for product teams, marketers, and customer success managers.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Full Stack', 'React + Node.js + PostgreSQL'],
                ['AI Ready', 'ABSA pipeline architecture'],
                ['MVC Pattern', 'Clean modular codebase'],
                ['JWT Secured', 'Role-based access control'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: MessageSquare, label: 'Review Analysis', color: 'from-primary-500/20 to-primary-600/10 border-primary-500/20', ic: 'text-primary-400' },
              { icon: Brain, label: 'AI Processing', color: 'from-violet-500/20 to-violet-600/10 border-violet-500/20', ic: 'text-violet-400' },
              { icon: BarChart3, label: 'Visual Reports', color: 'from-sky-500/20 to-sky-600/10 border-sky-500/20', ic: 'text-sky-400' },
              { icon: ShieldCheck, label: 'Secure Auth', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20', ic: 'text-emerald-400' },
            ].map(({ icon: Icon, label, color, ic }) => (
              <div key={label} className={`card p-6 bg-gradient-to-br ${color} border text-center`}>
                <Icon className={`w-8 h-8 mx-auto mb-3 ${ic}`} />
                <p className="text-sm font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <div className="section-divider mx-6" />

      {/* ======================== WHY ABSA ======================== */}
      <Section id="why" className="py-24 px-6 bg-surface-800/30">
        <div className="max-w-7xl mx-auto text-center mb-14">
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Why AspectAI?</span>
          <h2 className="text-3xl lg:text-4xl font-black text-white mt-3 mb-4">
            Why Aspect-Based Sentiment Analysis?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Traditional sentiment analysis gives you a single score. ABSA gives you a complete picture of <em>what</em> customers love and hate about <em>every feature</em> of your product.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎯', title: 'Granular Insights',
              desc: 'Instead of "4 stars", know that customers love the Camera (92%) but dislike the Battery (38%). Pinpoint exactly what to fix.',
            },
            {
              icon: '📈', title: 'Competitive Advantage',
              desc: 'Benchmark your product\'s aspects against competitors. See where you lead and where you\'re losing customers.',
            },
            {
              icon: '⚡', title: 'Faster Decision Making',
              desc: 'R&D teams get direct prioritized feedback. No more reading 10,000 reviews manually — AI summarizes in seconds.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card p-6 text-center">
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ======================== FEATURES ======================== */}
      <Section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-3 mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-xl mx-auto">A complete analytics platform built for modern e-commerce feedback intelligence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="card p-6 group"
              >
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <div className="section-divider mx-6" />

      {/* ======================== WORKFLOW ======================== */}
      <Section id="workflow" className="py-24 px-6 bg-surface-800/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-3 mb-4">4-Step AI Workflow</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="hidden lg:block absolute top-12 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px bg-gradient-to-r from-primary-500/30 via-violet-500/30 to-sky-500/30" />
            {WORKFLOW.map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card p-6 text-center relative"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-lg glow-primary">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold text-primary-400 mb-2 block">Step {step}</span>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======================== TECHNOLOGIES ======================== */}
      <Section id="technologies" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Tech Stack</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-3 mb-4">Technologies Used</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Built with production-grade tools used by top tech companies worldwide.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {TECHS.map(({ name, color, bg, border }) => (
              <motion.div
                key={name}
                whileHover={{ scale: 1.06, y: -2 }}
                className={`${bg} border ${border} rounded-xl px-4 py-3 flex items-center gap-2.5 cursor-default transition`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-slate-200">{name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <div className="section-divider mx-6" />

      {/* ======================== STATISTICS ======================== */}
      <Section id="stats" className="py-24 px-6 bg-surface-800/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">By The Numbers</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-3">Platform Statistics</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(({ value, suffix, label, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 text-center"
              >
                <Icon className={`w-8 h-8 mx-auto mb-3 ${color}`} />
                <p className="text-3xl font-black text-white mb-1">
                  <Counter target={value} suffix={suffix} />
                </p>
                <p className="text-sm text-slate-400">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======================== TEAM ======================== */}
      <Section id="team" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">Meet the Team</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-3 mb-4">The People Behind AspectAI</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(({ name, role, avatar, color, bio }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 text-center group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4 text-xl font-black text-white shadow-lg group-hover:scale-110 transition`}>
                  {avatar}
                </div>
                <h3 className="font-bold text-white mb-1">{name}</h3>
                <p className="text-xs text-primary-400 font-medium mb-3">{role}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <div className="section-divider mx-6" />

      {/* ======================== CONTACT ======================== */}
      <Section id="contact" className="py-24 px-6 bg-surface-800/20">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Get in Touch</span>
          <h2 className="text-3xl lg:text-4xl font-black text-white mt-3 mb-4">Contact Us</h2>
          <p className="text-slate-400 mb-10">Questions about the project? Want to collaborate? Drop us a message.</p>

          {contactSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-8 border border-emerald-500/30 bg-emerald-500/05"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
              <p className="text-slate-400">We will get back to you within 24 hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleContact} className="card p-8 space-y-5 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Your name"
                    value={contactForm.name}
                    onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Email</label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="your@email.com"
                    value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Message</label>
                <textarea
                  rows={4}
                  required
                  className="input resize-none"
                  placeholder="Tell us about your project or question..."
                  value={contactForm.message}
                  onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </Section>

      {/* ======================== CTA BANNER ======================== */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative glass rounded-3xl p-12 text-center overflow-hidden glow-ring">
            <AnimatedBlobs />
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Ready to Analyze Your Reviews?</h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">Create a free account and explore the dashboard with 15,000+ pre-loaded product reviews.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register" className="btn-primary flex items-center gap-2 px-8 py-3 text-sm font-semibold">
                  Start Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn-ghost flex items-center gap-2 px-8 py-3 text-sm font-semibold">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
