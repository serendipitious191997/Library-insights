import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  ArrowLeftRight,
  AlertOctagon,
  TrendingUp,
  Upload,
  ShieldCheck,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Library,
  UserCircle
} from 'lucide-react';

export default function Sidebar({ isCollapsed, onToggleCollapse, adminName = 'Chief Librarian' }) {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Books & Inventory', path: '/books', icon: BookOpen },
    { name: 'Loan Records', path: '/loans', icon: ClipboardList },
    { name: 'Issue / Return', path: '/issue-return', icon: ArrowLeftRight },
    { name: 'Overdue Management', path: '/overdue', icon: AlertOctagon },
    { name: 'Demand Analytics', path: '/analytics', icon: TrendingUp },
    { name: 'Data Import', path: '/import', icon: Upload },
    { name: 'Data Validation', path: '/validation', icon: ShieldCheck },
    { name: 'Reports & Export', path: '/reports', icon: FileSpreadsheet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-navy-850 border-r border-navy-700/60 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header / Brand */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-navy-700/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 text-white">
              <Library className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="text-base font-bold text-white tracking-tight">Library Insights</span>
                <span className="block text-[10px] uppercase font-semibold tracking-wider text-teal-400">Circulation & Demand</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700/50 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800'
                  }`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile / Status Footer */}
      <div className="p-3 border-t border-navy-700/60 bg-navy-800/40">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-navy-700 border border-teal-500/30 flex items-center justify-center shrink-0 text-teal-300">
            <UserCircle className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-400">Admin Mode</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
