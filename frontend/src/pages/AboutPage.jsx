import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AnimatedBlobs from '../components/ui/AnimatedBlobs';
import { Layers, Github, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-900 text-slate-200 overflow-x-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 relative pt-24 pb-16">
        <div className="absolute inset-0 bg-hero-gradient grid-dots z-0 pointer-events-none" />
        <AnimatedBlobs />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg glow-primary mx-auto mb-6">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">About AspectAI</h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              An academic project demonstrating the power of Aspect-Based Sentiment Analysis in modern e-commerce.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8 md:p-10 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-primary-400" />
              Project Background
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                AspectAI was developed as a 5th Semester Academic Project to solve a critical problem in e-commerce: <strong>information overload in customer reviews</strong>.
              </p>
              <p>
                While star ratings provide a general overview of product satisfaction, they fail to explain <em>why</em> a product is rated a certain way. A 3-star review might indicate an average product, or it might indicate a product with an incredible camera but terrible battery life.
              </p>
              <p>
                By implementing Aspect-Based Sentiment Analysis (ABSA), this platform automatically extracts the key features (aspects) customers care about and determines their specific sentiment towards each one.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
            <div className="card p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-violet-400" />
                Technical Architecture
              </h2>
              <ul className="space-y-3">
                {[
                  'React (Vite) Frontend',
                  'Node.js & Express API',
                  'PostgreSQL Relational DB',
                  'JWT Authentication',
                  'Framer Motion Animations',
                  'Recharts Data Visualization'
                ].map((tech) => (
                  <li key={tech} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">{tech}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <Github className="w-5 h-5 text-sky-400" />
                Open Source
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                This project was built to demonstrate modern full-stack development practices combined with AI-driven analytics concepts.
              </p>
              <a href="#" className="btn-ghost w-full flex items-center justify-center gap-2">
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
