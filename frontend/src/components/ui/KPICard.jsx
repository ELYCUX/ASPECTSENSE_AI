import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, icon: Icon, color = 'primary', trend, suffix = '', delay = 0 }) {
  const colorMap = {
    primary: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-600' },
  };
  const c = colorMap[color] || colorMap.primary;

  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="card-kpi p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              isNegative ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                'bg-white/5 text-gray-400'
            }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
            {isPositive ? '+' : ''}{trend}%
          </div>
        )}
      </div>

      <div>
        <motion.p
          className="text-2xl font-bold text-white mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-lg text-gray-500 ml-0.5">{suffix}</span>}
        </motion.p>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
    </motion.div>
  );
}
