import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  FileQuestion,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { ValidationAPI, ReportsAPI } from '../services/api';

export default function Validation() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [fieldFilter, setFieldFilter] = useState('All');

  const fetchValidation = async () => {
    setIsLoading(true);
    try {
      const res = await ValidationAPI.getReport();
      setReport(res.data);
    } catch (err) {
      toast.error(`Validation audit failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setIsLoading(true);
    try {
      const res = await ValidationAPI.runCheck();
      setReport(res.data);
      toast.success('Database quality audit executed successfully.');
    } catch (err) {
      toast.error(`Audit failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, []);

  const issues = report?.issues || [];
  const filteredIssues = issues.filter((iss) => {
    if (severityFilter !== 'All' && iss.severity.toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }
    if (fieldFilter !== 'All' && iss.field.toLowerCase() !== fieldFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const uniqueFields = Array.from(new Set(issues.map((i) => i.field)));

  const columns = [
    {
      header: 'Row #',
      accessor: 'row_number',
      render: (r) => <span className="font-mono text-xs text-slate-400">Row {r.row_number || 'N/A'}</span>,
    },
    {
      header: 'Loan ID',
      accessor: 'loan_id',
      render: (r) => <span className="font-mono text-xs font-semibold text-rose-400">{r.loan_id || 'N/A'}</span>,
    },
    {
      header: 'Field',
      accessor: 'field',
      render: (r) => (
        <span className="font-medium text-xs text-slate-200 uppercase tracking-wider">{r.field}</span>
      ),
    },
    {
      header: 'Issue Type',
      accessor: 'issue_type',
      render: (r) => (
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            r.severity === 'error'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}
        >
          {r.issue_type}
        </span>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (r) => (
        <span
          className={`text-xs uppercase font-bold ${
            r.severity === 'error' ? 'text-rose-400' : 'text-amber-400'
          }`}
        >
          {r.severity}
        </span>
      ),
    },
    {
      header: 'Audit Message',
      accessor: 'message',
      render: (r) => <span className="text-xs text-slate-300">{r.message}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Data Quality & Integrity Monitoring
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Automated verification of 11 database rules: duplicate IDs, missing fields, inverted dates, and foreign key relations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunAudit}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Run Full Audit
          </button>
          <a
            href={ReportsAPI.exportValidationCSVUrl}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export Validation CSV
          </a>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard
          title="Total Checked"
          value={report ? report.total_checked : '—'}
          subtitle="Circulation records"
          icon={ShieldCheck}
          color="indigo"
        />
        <StatCard
          title="Valid Records"
          value={report ? report.valid_records : '—'}
          subtitle="100% compliant"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Invalid Records"
          value={report ? report.invalid_records : '—'}
          subtitle="Contains errors"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Duplicate IDs"
          value={report ? report.duplicate_records : '—'}
          subtitle="Redundant Loan IDs"
          icon={Copy}
          color="amber"
        />
        <StatCard
          title="Incomplete Records"
          value={report ? report.incomplete_records : '—'}
          subtitle="Missing mandatory fields"
          icon={FileQuestion}
          color="cyan"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-navy-850 p-4 rounded-2xl border border-navy-700/60 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Issues:</span>
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Severities</option>
          <option value="error">Errors Only</option>
          <option value="warning">Warnings Only</option>
        </select>

        {uniqueFields.length > 0 && (
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="bg-navy-800 border border-navy-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="All">All Fields</option>
            {uniqueFields.map((f) => (
              <option key={f} value={f}>
                Field: {f}
              </option>
            ))}
          </select>
        )}

        {(severityFilter !== 'All' || fieldFilter !== 'All') && (
          <button
            onClick={() => {
              setSeverityFilter('All');
              setFieldFilter('All');
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium underline ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Validation Issues Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Audit Log Details ({filteredIssues.length} issues)
          </h3>
          <span className="text-xs text-slate-400">
            {report?.invalid_records === 0
              ? '✅ Zero schema violations in database'
              : `⚠️ ${report?.invalid_records} records require attention`}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredIssues}
          isLoading={isLoading}
          emptyMessage="Outstanding database health check! No integrity errors or validation violations found."
        />
      </div>
    </div>
  );
}
