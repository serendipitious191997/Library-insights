import React from 'react';

export default function ChartCard({ title, subtitle, children, headerAction, height = 'h-72' }) {
  return (
    <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      <div className={`w-full ${height} flex items-center justify-center`}>
        {children}
      </div>
    </div>
  );
}
