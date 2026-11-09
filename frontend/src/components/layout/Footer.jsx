import { Link } from 'react-router-dom';
import { Layers, Github, Linkedin, Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/06 bg-surface-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">AspectAI</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              An AI-powered review analytics platform that automatically analyzes e-commerce product feedback and extracts per-aspect sentiment insights.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:border-primary-500/40 transition">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:border-primary-500/40 transition">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="mailto:contact@aspectai.com" className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:border-primary-500/40 transition">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[['/', 'Home'], ['/dashboard', 'Dashboard'], ['/reviews', 'Reviews'], ['/analytics', 'Analytics']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-slate-400 hover:text-primary-400 text-sm transition">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4">Tech Stack</h4>
            <ul className="space-y-2.5">
              {['React + Vite', 'Node.js + Express', 'PostgreSQL', 'JWT Auth', 'Tailwind CSS', 'Framer Motion'].map(tech => (
                <li key={tech} className="text-slate-400 text-sm">{tech}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="section-divider mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2024 AspectAI. All rights reserved. Built for academic demonstration.
          </p>
          <p className="text-slate-500 text-sm flex items-center gap-1.5">
            Made with <Heart className="w-3.5 h-3.5 text-red-400 fill-current" /> for 5th Semester Project
          </p>
        </div>
      </div>
    </footer>
  );
}
