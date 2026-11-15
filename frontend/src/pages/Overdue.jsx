import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Clock,
  History,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { AnalyticsAPI, LoansAPI } from '../services/api';

const CATEGORIES = [
  'Computer Science',
  'Mathematics',
  'Electronics',
  'Physics',
  'Mechanical Engineering',
  'Chemistry',
];

export default function Overdue() {
  const [currentlyOverdue, setCurrentlyOverdue] = useState([]);
  const [returnedLate, setReturnedLate] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [studentFilter, setStudentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [minDaysFilter, setMinDaysFilter] = useState('');

  const fetchOverdueData = async () => {
    setIsLoading(true);
    try {
      const [resOverdue, resLate] = await Promise.all([
        AnalyticsAPI.getOverdue({
          student_id: studentFilter || undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          min_days_overdue: minDaysFilter ? parseInt(minDaysFilter, 10) : undefined,
        }),
        AnalyticsAPI.getReturnedLate({
          student_id: studentFilter || undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
        }),
      ]);

      setCurrentlyOverdue(resOverdue.data || []);
      setReturnedLate(resLate.data || []);
    } catch (err) {
      toast.error(`Error loading overdue data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueData();
  }, [studentFilter, categoryFilter, minDaysFilter]);

  const handleQuickReturn = async (loanId) => {
    try {
      await LoansAPI.returnBook(loanId);
      toast.success(`Book for loan '${loanId}' returned and inventory restocked!`);
      fetchOverdueData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Summaries
  const totalOverdue = currentlyOverdue.length;
  const maxDaysOverdue = currentlyOverdue.reduce((max, i) => Math.max(max, i.days_overdue), 0);
  const totalLateReturned = returnedLate.length;

  const overdueColumns = [
    {
      header: 'Loan ID',
      accessor: 'loan_id',
      render: (r) => <span className="font-mono text-xs font-semibold text-rose-400">{r.loan_id}</span>,
    },
    {
      header: 'Book Title',
      accessor: 'book_title',
      render: (r) => (
        <span className="font-semibold text-white max-w-[220px] truncate block" title={r.book_title}>
          {r.book_title}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (r) => <span className="text-xs text-slate-300">{r.category}</span>,
    },
    {
      header: 'Student ID',
      accessor: 'student_id',
      render: (r) => <span className="font-mono text-xs text-slate-300 font-medium">{r.student_id}</span>,
    },
    {
      header: 'Borrow Date',
      accessor: 'borrow_date',
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
    },
    {
      header: 'Days Overdue',
      accessor: 'days_overdue',
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <Clock className="w-3 h-3 animate-pulse" />
          +{r.days_overdue} days
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (r) => (
        <button
          onClick={() => handleQuickReturn(r.loan_id)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-navy-800 hover:bg-teal-600 hover:text-white text-teal-400 border border-teal-500/30 transition-all flex items-center gap-1"
          title="Return Book Now"
        >
          <RotateCcw className="w-3 h-3" /> Return
        </button>
      ),
    },
  ];

  const lateColumns = [
    {
      header: 'Loan ID',
      accessor: 'loan_id',
      render: (r) => <span className="font-mono text-xs font-semibold text-amber-400">{r.loan_id}</span>,
    },
    {
      header: 'Book Title',
      accessor: 'book_title',
      render: (r) => (
        <span className="font-medium text-white max-w-[220px] truncate block" title={r.book_title}>
          {r.book_title}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (r) => <span className="text-xs text-slate-300">{r.category}</span>,
    },
    {
      header: 'Student ID',
      accessor: 'student_id',
      render: (r) => <span className="font-mono text-xs text-slate-300">{r.student_id}</span>,
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
    },
    {
      header: 'Return Date',
      accessor: 'return_date',
      render: (r) => <span className="text-slate-200">{r.return_date}</span>,
    },
    {
      header: 'Days Late',
      accessor: 'days_late',
      render: (r) => (
        <span className="font-semibold text-xs text-amber-400">
          +{r.days_late} days late
        </span>
      ),
    },
    {
      header: 'Total Loan Duration',
      accessor: 'loan_duration',
      render: (r) => (
        <span className="text-xs text-slate-400">{r.loan_duration} days</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-navy-700/60">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Overdue & Late Return Management
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Monitor unreturned loans that crossed due dates and historical delayed circulation transactions.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Currently Overdue"
          value={totalOverdue}
          subtitle="Unreturned past due date"
          icon={AlertOctagon}
          color="rose"
        />
        <StatCard
          title="Longest Delay"
          value={maxDaysOverdue > 0 ? `+${maxDaysOverdue} days` : '0 days'}
          subtitle="Highest delinquency duration"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Returned Late History"
          value={totalLateReturned}
          subtitle="Completed after due date"
          icon={History}
          color="indigo"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-navy-850 p-4 rounded-2xl border border-navy-700/60 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            placeholder="Filter by Student ID..."
            className="w-full bg-navy-800 border border-navy-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Min Overdue Days:</span>
          <input
            type="number"
            min="1"
            value={minDaysFilter}
            onChange={(e) => setMinDaysFilter(e.target.value)}
            placeholder="e.g. 3"
            className="w-20 bg-navy-800 border border-navy-700/80 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
        </div>

        {(studentFilter || categoryFilter !== 'All' || minDaysFilter) && (
          <button
            onClick={() => {
              setStudentFilter('');
              setCategoryFilter('All');
              setMinDaysFilter('');
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Section A: Currently Overdue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              Currently Overdue Books ({totalOverdue})
            </h3>
            <p className="text-xs text-slate-400">
              Active loans where reference date has exceeded the assigned due date
            </p>
          </div>
        </div>

        <DataTable
          columns={overdueColumns}
          data={currentlyOverdue}
          isLoading={isLoading}
          emptyMessage="No currently overdue books found. All active borrowings are within their due dates."
        />
      </div>

      {/* Section B: Returned Late */}
      <div className="space-y-3 pt-4 border-t border-navy-700/60">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Returned Late Transactions ({totalLateReturned})
          </h3>
          <p className="text-xs text-slate-400">
            Historical transactions where the book was returned after the due date
          </p>
        </div>

        <DataTable
          columns={lateColumns}
          data={returnedLate}
          isLoading={isLoading}
          emptyMessage="No returned-late borrowing transactions recorded."
        />
      </div>
    </div>
  );
}
