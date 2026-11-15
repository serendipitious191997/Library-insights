import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search records...',
  categories = [],
  selectedCategory = 'All',
  onCategoryChange,
  statuses = [],
  selectedStatus = 'All',
  onStatusChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-navy-800 border border-navy-700/80 rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      {categories && categories.length > 0 && onCategoryChange && (
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-navy-800 border border-navy-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all cursor-pointer"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {/* Status Filter */}
      {statuses && statuses.length > 0 && onStatusChange && (
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-navy-800 border border-navy-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all cursor-pointer"
        >
          <option value="All">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
