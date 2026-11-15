import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Calendar, Search, Shield, ChevronRight } from 'lucide-react';

export default function Topbar({ isCollapsed, effectiveDate, libraryName = 'University Central Library' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const pathTitles = {
    '/': { title: 'Overview', crumb: 'Dashboard / Overview' },
    '/books': { title: 'Books & Inventory', crumb: 'Circulation / Books & Inventory' },
    '/loans': { title: 'Loan Records', crumb: 'Circulation / Loan Records' },
    '/issue-return': { title: 'Issue / Return Management', crumb: 'Circulation / Issue & Return' },
    '/overdue': { title: 'Overdue Management', crumb: 'Monitoring / Overdue Books' },
    '/analytics': { title: 'Demand Analytics', crumb: 'Analytics / Demand & Trends' },
    '/import': { title: 'Data Import', crumb: 'Data Management / CSV Import' },
    '/validation': { title: 'Data Validation', crumb: 'Data Quality / Health Audit' },
    '/reports': { title: 'Reports & Export', crumb: 'Reporting / Export & Print' },
    '/settings': { title: 'Settings', crumb: 'System / Configuration' },
  };

  const current = pathTitles[location.pathname] || { title: 'Dashboard', crumb: 'Library Insights' };

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/loans?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formattedDate = effectiveDate
    ? new Date(effectiveDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-navy-900/90 backdrop-blur-md border-b border-navy-700/60 transition-all duration-300 ease-in-out flex items-center justify-between px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
          <span>Library Insights</span>
          <ChevronRight className="w-3 h-3 text-slate-500" />
          <span className="text-teal-400">{current.crumb}</span>
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">{current.title}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleGlobalSearch}
            placeholder="Quick search loans (Enter)..."
            className="w-full bg-navy-800/80 border border-navy-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
          />
        </div>

        {/* System Date Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700/60 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-medium">{formattedDate}</span>
        </div>

        {/* Institution Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-800/50 border border-navy-700/40 text-xs text-slate-300">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate max-w-[150px] font-medium">{libraryName}</span>
        </div>

        {/* Notifications Icon */}
        <div className="relative p-2 rounded-xl bg-navy-800/80 border border-navy-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400" />
        </div>
      </div>
    </header>
  );
}
