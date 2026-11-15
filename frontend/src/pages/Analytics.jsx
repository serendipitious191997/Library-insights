import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Layers,
  Calendar,
  Clock,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import { AnalyticsAPI } from '../services/api';

const CATEGORY_COLORS = ['#0D9488', '#06B6D4', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [categoryData, setCategoryData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [durationData, setDurationData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [resCats, resMonthly, resDur, resInsights] = await Promise.all([
        AnalyticsAPI.getCategories(),
        AnalyticsAPI.getMonthly({ year: selectedYear || undefined }),
        AnalyticsAPI.getDuration(),
        AnalyticsAPI.getInsights(),
      ]);

      setCategoryData(resCats.data);
      setMonthlyData(resMonthly.data);
      setDurationData(resDur.data);
      setInsightsData(resInsights.data);
    } catch (err) {
      toast.error(`Analytics error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-navy-700/60">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Library Circulation Demand Analytics
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Statistical analysis and machine-generated insights powered by Python Pandas.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Top Category"
          value={categoryData?.highest_category || '—'}
          subtitle={`${categoryData?.highest_count || 0} loans (${categoryData?.total_loans ? Math.round((categoryData.highest_count / categoryData.total_loans) * 100) : 0}% of demand)`}
          icon={Layers}
          color="teal"
        />
        <StatCard
          title="Peak Month"
          value={monthlyData?.highest_month || '—'}
          subtitle={`${monthlyData?.highest_count || 0} borrowing transactions`}
          icon={Calendar}
          color="cyan"
        />
        <StatCard
          title="Avg Return Duration"
          value={durationData ? `${durationData.average_duration} days` : '—'}
          subtitle={`Min: ${durationData?.min_duration || 0}d | Max: ${durationData?.max_duration || 0}d`}
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="Most Frequent Range"
          value={durationData?.most_common_range || '—'}
          subtitle={`${durationData?.completed_loans_count || 0} completed loans analyzed`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* ================= SECTION A: CATEGORY ANALYSIS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Category Borrowing Frequency & Distribution"
            subtitle="Calculated frequency of borrowings per academic category"
            height="h-80"
          >
            {categoryData?.categories?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData.categories}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    width={110}
                  />
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
                      'Circulation Demand',
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {categoryData.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No category circulation data</p>
            )}
          </ChartCard>
        </div>

        {/* Category Contribution Table Card */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Category Contribution</h3>
            <p className="text-xs text-slate-400 mb-4">Percentage share of campus circulation</p>

            <div className="space-y-3">
              {categoryData?.categories?.map((cat, idx) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium truncate">{cat.category}</span>
                    <span className="text-slate-400 shrink-0 font-mono">
                      {cat.count} loans ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-navy-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-700/60 text-xs text-slate-400">
            Total Loans Analyzed: <strong className="text-white">{categoryData?.total_loans || 0}</strong>
          </div>
        </div>
      </div>

      {/* ================= SECTION B & C: MONTHLY TREND & DURATION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend with Year Filter */}
        <ChartCard
          title="Monthly Borrowing Circulation Trend"
          subtitle="Chronological transaction volume timeline"
          headerAction={
            monthlyData?.available_years?.length > 1 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-navy-800 border border-navy-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">All Years</option>
                {monthlyData.available_years.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            )
          }
          height="h-72"
        >
          {monthlyData?.trends?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData.trends} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
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
                  formatter={(value) => [`${value} loans`, 'Checkouts']}
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
            <p className="text-xs text-slate-500">No monthly data found</p>
          )}
        </ChartCard>

        {/* Loan Duration Distribution */}
        <ChartCard
          title="Loan Duration Distribution (Completed Loans)"
          subtitle="Frequency of checkouts by duration intervals in days"
          height="h-72"
        >
          {durationData?.distribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationData.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
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
            <p className="text-xs text-slate-500">No duration data available</p>
          )}
        </ChartCard>
      </div>

      {/* ================= SECTION D & E: DEMAND INSIGHTS & SUGGESTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand Insights */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-navy-700/60">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Automated Demand Insights</h3>
              <p className="text-xs text-slate-400">Empirical findings calculated from live transaction logs</p>
            </div>
          </div>

          <div className="space-y-3">
            {insightsData?.insights?.map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-navy-800/60 border border-navy-700/50 flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                <p className="text-sm text-slate-200 leading-relaxed font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Allocation Suggestions */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-navy-700/60">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Resource Allocation Suggestions</h3>
              <p className="text-xs text-slate-400">Data-driven procurement and curriculum recommendations</p>
            </div>
          </div>

          <div className="space-y-3">
            {insightsData?.resource_suggestions?.length > 0 ? (
              insightsData.resource_suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    sug.suggestion_type === 'Increase Copies'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : sug.suggestion_type === 'High Demand'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-navy-800/60 border-navy-700/50'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {sug.suggestion_type === 'Increase Copies' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{sug.suggestion_type}</span>
                      <span className="text-[11px] text-slate-400">({sug.category})</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{sug.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                Inventory allocation is optimal across all current titles.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
