import React from 'react';

export default function StatusBadge({ status, isOverdue = false, isLate = false }) {
  if (isOverdue || status === 'Overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
        Overdue
      </span>
    );
  }

  if (isLate || status === 'Returned Late') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Returned Late
      </span>
    );
  }

  if (status === 'Returned') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Returned
      </span>
    );
  }

  // Active
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
      Active
    </span>
  );
}
