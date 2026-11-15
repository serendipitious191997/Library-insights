import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found.',
  page = 1,
  pageSize = 10,
  onPageChange,
  totalCount,
}) {
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

  if (isLoading) {
    return (
      <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading records from database...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
        <div className="p-3 bg-navy-800 rounded-full text-slate-500 mb-3">
          <Inbox className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-white mb-1">No Records Found</h4>
        <p className="text-sm text-slate-400 max-w-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-850 border border-navy-700/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-navy-800/80 border-b border-navy-700/60 text-xs uppercase font-semibold text-slate-400 tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3.5 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700/40">
            {data.map((row, rIdx) => (
              <tr
                key={row.id || row.loan_id || row.book_id || rIdx}
                className="hover:bg-navy-800/40 transition-colors"
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`px-4 py-3.5 ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row, rIdx) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-navy-700/60 bg-navy-800/30 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-white">{Math.min(page * pageSize, totalCount || data.length)}</strong> of{' '}
            <strong className="text-white">{totalCount || data.length}</strong> records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-navy-700 hover:bg-navy-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-slate-300 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-navy-700 hover:bg-navy-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
