import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'teal', onClick }) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      text: 'text-teal-400',
      glow: 'group-hover:border-teal-500/40',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'group-hover:border-cyan-500/40',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: 'group-hover:border-rose-500/40',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'group-hover:border-amber-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'group-hover:border-emerald-500/40',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
      glow: 'group-hover:border-indigo-500/40',
    },
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-navy-850 border ${scheme.border} ${scheme.glow} rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
