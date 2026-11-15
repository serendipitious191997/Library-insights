import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileCode,
  CheckCircle,
  Copy,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ReportsAPI } from '../services/api';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedJson, setCopiedJson] = useState(false);

  const fetchPrintableReport = async () => {
    setIsLoading(true);
    try {
      const res = await ReportsAPI.getPrintableData();
      setReportData(res.data);
    } catch (err) {
      toast.error(`Error loading report: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrintableReport();
  }, []);

  const handleCopyJSON = () => {
    if (!reportData) return;
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
    setCopiedJson(true);
    toast.success('JSON analytics copied to clipboard!');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Circulation Reports & Data Export
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Export raw and processed datasets in standard CSV and JSON schemas, or generate an executive PDF report.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02] shrink-0"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* ================= EXPORT BUTTONS GRID (Hidden during print) ================= */}
      <div className="no-print grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Export Loans CSV */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="p-2.5 w-fit rounded-xl bg-teal-500/10 text-teal-400 mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Complete Loans</h4>
            <p className="text-xs text-slate-400 mt-1">
              All 10 columns: Loan ID, Book Title, Student ID, Borrow/Due/Return Dates, Duration, Status.
            </p>
          </div>
          <a
            href={ReportsAPI.exportLoansCSVUrl}
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-teal-400 border border-teal-500/30 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </a>
        </div>

        {/* Export Analytics JSON */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="p-2.5 w-fit rounded-xl bg-cyan-500/10 text-cyan-400 mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Summary Analytics</h4>
            <p className="text-xs text-slate-400 mt-1">
              Nested JSON: KPIs, category breakdown, monthly trends, duration statistics.
            </p>
          </div>
          <a
            href={ReportsAPI.exportSummaryJSONUrl}
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-cyan-400 border border-cyan-500/30 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download JSON
          </a>
        </div>

        {/* Export Overdue CSV */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="p-2.5 w-fit rounded-xl bg-rose-500/10 text-rose-400 mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Overdue Audit</h4>
            <p className="text-xs text-slate-400 mt-1">
              Currently unreturned overdue records and returned-late circulation items.
            </p>
          </div>
          <a
            href={ReportsAPI.exportOverdueCSVUrl}
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </a>
        </div>

        {/* Export Validation CSV */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="p-2.5 w-fit rounded-xl bg-amber-500/10 text-amber-400 mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Data Quality Audit</h4>
            <p className="text-xs text-slate-400 mt-1">
              Detailed log of integrity issues, duplicate IDs, and field anomalies.
            </p>
          </div>
          <a
            href={ReportsAPI.exportValidationCSVUrl}
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV
          </a>
        </div>
      </div>

      {/* ================= PRINTABLE EXECUTIVE REPORT CONTAINER ================= */}
      <div className="print-page bg-navy-850 border border-navy-700/60 rounded-2xl p-8 shadow-md space-y-6">
        {/* Printable Header */}
        <div className="border-b border-navy-700/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-teal-400 block mb-1">
              Official Circulation & Demand Report
            </span>
            <h3 className="text-2xl font-extrabold text-white">
              {reportData?.report_title || 'Library Circulation and Demand Analytics'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Academic Demonstration Project — Python Programming Laboratory
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-400 shrink-0">
            <p>Generated Date: <strong className="text-white">{reportData?.generated_date || 'N/A'}</strong></p>
            <p className="mt-0.5">Database Status: <strong className="text-emerald-400">Verified Persistent SQLite</strong></p>
          </div>
        </div>

        {/* Key Numerical Summaries */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-navy-800/60 border border-navy-700/50">
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Borrowings</p>
            <p className="text-2xl font-bold text-white mt-1">{reportData?.total_loans ?? '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-800/60 border border-navy-700/50">
            <p className="text-xs text-slate-400 uppercase font-semibold">Active Checkouts</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{reportData?.active_loans ?? '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-800/60 border border-navy-700/50">
            <p className="text-xs text-slate-400 uppercase font-semibold">Overdue Books</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{reportData?.overdue_count ?? '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-800/60 border border-navy-700/50">
            <p className="text-xs text-slate-400 uppercase font-semibold">Average Duration</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {reportData?.average_loan_duration_days ? `${reportData.average_loan_duration_days} days` : '—'}
            </p>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Category-wise Circulation Summary
          </h4>
          <div className="overflow-x-auto border border-navy-700/60 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-navy-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Borrowing Count</th>
                  <th className="px-4 py-2.5">Demand Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/40">
                {reportData?.category_summary?.breakdown?.map((item) => (
                  <tr key={item.category} className="hover:bg-navy-800/20">
                    <td className="px-4 py-2.5 font-medium text-white">{item.category}</td>
                    <td className="px-4 py-2.5">{item.count} loans</td>
                    <td className="px-4 py-2.5">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Duration Bins Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Loan Duration Distribution Statistics
          </h4>
          <div className="overflow-x-auto border border-navy-700/60 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-navy-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Duration Interval</th>
                  <th className="px-4 py-2.5">Transactions Count</th>
                  <th className="px-4 py-2.5">Percentage of Completed Loans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/40">
                {reportData?.loan_duration_statistics?.distribution?.map((item) => (
                  <tr key={item.range_label} className="hover:bg-navy-800/20">
                    <td className="px-4 py-2.5 font-medium text-white">{item.range_label}</td>
                    <td className="px-4 py-2.5">{item.count} loans</td>
                    <td className="px-4 py-2.5">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Executive Findings Summary */}
        <div className="p-4 rounded-xl bg-navy-800/40 border border-navy-700/50 space-y-2 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-bold text-white text-sm">Key Analytical Findings</h4>
          <p>
            • Highest Circulation Category:{' '}
            <strong className="text-teal-400">
              {reportData?.category_summary?.highest_demand_category || 'N/A'}
            </strong>.
          </p>
          <p>
            • Peak Monthly Activity:{' '}
            <strong className="text-cyan-400">
              {reportData?.monthly_summary?.highest_month || 'N/A'}
            </strong>.
          </p>
          <p>
            • Most Frequent Borrowing Duration Interval:{' '}
            <strong className="text-emerald-400">
              {reportData?.loan_duration_statistics?.most_common_range || 'N/A'}
            </strong>.
          </p>
        </div>
      </div>

      {/* JSON Schema Live Viewer (Hidden during print) */}
      <div className="no-print bg-navy-850 border border-navy-700/60 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Standard Structured JSON Output</h3>
          </div>
          <button
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 transition-colors"
          >
            {copiedJson ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy JSON
              </>
            )}
          </button>
        </div>
        <pre className="bg-navy-900 border border-navy-700/80 rounded-xl p-4 text-xs font-mono text-teal-300 overflow-x-auto max-h-72">
          {reportData ? JSON.stringify(reportData, null, 2) : 'Loading structured JSON payload...'}
        </pre>
      </div>
    </div>
  );
}
