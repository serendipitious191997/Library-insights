import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  AlertOctagon,
  Layers,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Upload,
  FileText,
  Bookmark
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';

import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { AnalyticsAPI } from '../services/api';

const STATUS_COLORS = {
  Active: '#06B6D4',
  Returned: '#10B981',
  Overdue: '#EF4444',
};

const CATEGORY_COLORS = ['#0D9488', '#06B6D4', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [durationData, setDurationData] = useState([]);
  const [statusDonutData, setStatusDonutData] = useState([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [resOverview, resCats, resMonthly, resDur] = await Promise.all([
        AnalyticsAPI.getOverview(),
        AnalyticsAPI.getCategories(),
        AnalyticsAPI.getMonthly(),
        AnalyticsAPI.getDuration(),
      ]);

      const ov = resOverview.data;
      setOverview(ov);
      setCategoryData(resCats.data.categories || []);
      setMonthlyData(resMonthly.data.trends || []);
      setDurationData(resDur.data.distribution || []);

      // Build Status Donut Data
      const activeCount = Math.max(0, (ov.active_loans || 0) - (ov.overdue_books || 0));
      const returnedCount = Math.max(0, (ov.total_loans || 0) - (ov.active_loans || 0));
      setStatusDonutData([
        { name: 'Active', value: activeCount, color: STATUS_COLORS.Active },
        { name: 'Returned', value: returnedCount, color: STATUS_COLORS.Returned },
        { name: 'Overdue', value: ov.overdue_books || 0, color: STATUS_COLORS.Overdue },
      ]);
    } catch (err) {
      toast.error(`Dashboard error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const recentColumns = [
    {
      header: 'Loan ID',
      accessor: 'loan_id',
      render: (r) => <span className="font-mono text-xs text-teal-400 font-semibold">{r.loan_id}</span>,
    },
    {
      header: 'Book Title',
      accessor: 'book_title',
      render: (r) => (
        <span className="font-medium text-white max-w-[200px] truncate block" title={r.book_title}>
          {r.book_title}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (r) => <span className="text-xs text-slate-400">{r.category}</span>,
    },
    {
      header: 'Student ID',
      accessor: 'student_id',
      render: (r) => <span className="font-mono text-xs text-slate-300">{r.student_id}</span>,
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
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge status={r.status} isOverdue={r.is_overdue} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Heading & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Library Circulation Overview
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Monitor borrowing activities, book demand and library performance in real time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/issue-return')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            Issue Book
          </button>
          <button
            onClick={() => navigate('/import')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 transition-all"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            Import CSV
          </button>
          <button
            onClick={() => navigate('/overdue')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
          >
            <AlertOctagon className="w-4 h-4" />
            View Overdue ({overview?.overdue_books || 0})
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 transition-all"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            Generate Report
          </button>
        </div>
      </div>

      {/* 6 Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Loans"
          value={overview ? overview.total_loans : '—'}
          subtitle="All transactions"
          icon={ClipboardList}
          color="teal"
          onClick={() => navigate('/loans')}
        />
        <StatCard
          title="Active Loans"
          value={overview ? overview.active_loans : '—'}
          subtitle="Currently issued"
          icon={Bookmark}
          color="cyan"
          onClick={() => navigate('/loans?status=Active')}
        />
        <StatCard
          title="Overdue Books"
          value={overview ? overview.overdue_books : '—'}
          subtitle="Past due date"
          icon={AlertOctagon}
          color="rose"
          onClick={() => navigate('/overdue')}
        />
        <StatCard
          title="Total Books"
          value={overview ? overview.total_books : '—'}
          subtitle="Distinct inventory titles"
          icon={BookOpen}
          color="indigo"
          onClick={() => navigate('/books')}
        />
        <StatCard
          title="Categories"
          value={overview ? overview.total_categories : '—'}
          subtitle="Distinct subjects"
          icon={Layers}
          color="amber"
          onClick={() => navigate('/analytics')}
        />
        <StatCard
          title="Avg Loan Days"
          value={overview ? `${overview.average_loan_duration}d` : '—'}
          subtitle="Completed borrowings"
          icon={Clock}
          color="emerald"
          onClick={() => navigate('/analytics')}
        />
      </div>

      {/* 4 Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category-wise Borrowing Bar Chart */}
        <ChartCard
          title="Category-wise Circulation Demand"
          subtitle="Frequency of borrowings across book categories"
          headerAction={
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              Detailed Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="#64748B"
                  fontSize={11}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => [`${value} loans`, 'Borrowings']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500">No category borrowing data</p>
          )}
        </ChartCard>

        {/* Chart 2: Monthly Borrowing Trend */}
        <ChartCard
          title="Monthly Circulation Trend"
          subtitle="Borrowing transaction volume by calendar month"
          headerAction={
            <span className="text-xs text-slate-400 bg-navy-800 px-2.5 py-1 rounded-lg border border-navy-700">
              Monthly Timeline
            </span>
          }
        >
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month_name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value} loans`, 'Volume']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06B6D4', strokeWidth: 2, stroke: '#0F172A' }}
                  activeDot={{ r: 6, fill: '#14B8A6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500">No monthly circulation data</p>
          )}
        </ChartCard>

        {/* Chart 3: Loan Duration Distribution */}
        <ChartCard
          title="Loan Duration Distribution"
          subtitle="Completed borrowings grouped by return duration"
        >
          {durationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="range_label" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(value, name, item) => [
                    `${value} loans (${item.payload.percentage}%)`,
                    'Count',
                  ]}
                />
                <Bar dataKey="count" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500">No completed loan duration records</p>
          )}
        </ChartCard>

        {/* Chart 4: Loan Status Distribution Donut */}
        <ChartCard
          title="Circulation Status Breakdown"
          subtitle="Proportion of active, returned, and overdue loans"
        >
          {statusDonutData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => [`${value} loans`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500">No circulation records</p>
          )}
        </ChartCard>
      </div>

      {/* Recent Activities Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Recent Circulation Activities</h3>
            <p className="text-xs text-slate-400">Latest borrowing transactions recorded across campus</p>
          </div>
          <button
            onClick={() => navigate('/loans')}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
          >
            View All Loan Records <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <DataTable
          columns={recentColumns}
          data={overview?.recent_activities || []}
          isLoading={isLoading}
          emptyMessage="No recent circulation activities recorded."
        />
      </div>
    </div>
  );
}
