import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import { ImportAPI } from '../services/api';

export default function ImportData() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Only comma-separated (.csv) files are supported.');
        return;
      }
      setSelectedFile(file);
      setPreviewResult(null);
      setImportSuccess(null);
      uploadAndPreview(file);
    }
  };

  const uploadAndPreview = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await ImportAPI.preview(formData);
      setPreviewResult(res.data);
      if (res.data.can_import) {
        toast.success(`Validated ${res.data.total_rows} records. Ready for import!`);
      } else {
        toast.error(`File contains critical errors preventing full import.`);
      }
    } catch (err) {
      toast.error(`CSV Preview failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async (validOnly = true) => {
    if (!previewResult || !previewResult.preview_rows) return;

    setIsImporting(true);
    try {
      // Re-read file records or send preview records
      // In our architecture, the client can confirm importing valid rows:
      const res = await ImportAPI.confirm({
        import_valid_only: validOnly,
        records: previewResult.preview_rows,
      });

      setImportSuccess(res.data);
      toast.success(res.data.message || 'Records successfully imported into database.');
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadErrorReportCSV = () => {
    if (!previewResult || !previewResult.issues || previewResult.issues.length === 0) {
      toast('No validation errors recorded.', { icon: 'ℹ️' });
      return;
    }

    const headers = ['Row Number', 'Loan ID', 'Field', 'Issue Type', 'Severity', 'Message'];
    const rows = previewResult.issues.map((i) => [
      i.row_number || 'N/A',
      i.loan_id || 'N/A',
      i.field,
      i.issue_type,
      i.severity,
      `"${i.message.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `import_errors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewColumns = previewResult?.preview_rows?.length > 0
    ? Object.keys(previewResult.preview_rows[0]).map((key) => ({
        header: key,
        accessor: key,
        render: (r) => <span className="text-xs text-slate-300 font-mono">{r[key] || '—'}</span>,
      }))
    : [];

  const issueColumns = [
    {
      header: 'Row #',
      accessor: 'row_number',
      render: (r) => <span className="font-mono text-xs text-slate-400">Row {r.row_number}</span>,
    },
    {
      header: 'Loan ID',
      accessor: 'loan_id',
      render: (r) => <span className="font-mono text-xs text-rose-400 font-semibold">{r.loan_id}</span>,
    },
    {
      header: 'Field',
      accessor: 'field',
      render: (r) => <span className="text-xs text-slate-300 font-medium">{r.field}</span>,
    },
    {
      header: 'Issue Type',
      accessor: 'issue_type',
      render: (r) => (
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            r.severity === 'error'
              ? 'bg-rose-500/15 text-rose-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {r.issue_type}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: 'message',
      render: (r) => <span className="text-xs text-slate-300">{r.message}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-navy-700/60">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          CSV Circulation Data Import
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Upload batch borrowing transactions, validate against 11 quality rules, and import safely into SQLite.
        </p>
      </div>

      {/* Expected Columns Notice */}
      <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Required CSV Columns:</strong> Loan ID, Book ID, Book Title, Category, Student ID, Borrow Date, Due Date. (Return Date optional).
          </span>
        </div>
        <a
          href="/api/export/loans/csv"
          className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Download Standard CSV Template
        </a>
      </div>

      {/* Drag & Drop Upload Card */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="bg-navy-850 hover:bg-navy-800/80 border-2 border-dashed border-navy-700 hover:border-teal-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 group-hover:scale-110 flex items-center justify-center mb-3 transition-transform shadow-lg shadow-teal-900/20">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">
          {selectedFile ? selectedFile.name : 'Select or Drag & Drop CSV File'}
        </h4>
        <p className="text-xs text-slate-400 max-w-md">
          {selectedFile
            ? `File ready for verification (${(selectedFile.size / 1024).toFixed(1)} KB)`
            : 'Supports comma-separated files up to 5 MB. All dates will be normalised to YYYY-MM-DD.'}
        </p>
      </div>

      {/* Verification Results Panel */}
      {previewResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-navy-850 border border-navy-700/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase">Total Rows</p>
              <p className="text-2xl font-bold text-white mt-0.5">{previewResult.total_rows}</p>
            </div>
            <div className="bg-navy-850 border border-navy-700/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase">Valid Records</p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                {previewResult.valid_rows_count}
              </p>
            </div>
            <div className="bg-navy-850 border border-navy-700/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase">Invalid Rows</p>
              <p className="text-2xl font-bold text-rose-400 mt-0.5">
                {previewResult.invalid_rows_count}
              </p>
            </div>
            <div className="bg-navy-850 border border-navy-700/60 rounded-xl p-4 flex flex-col justify-between">
              <p className="text-xs text-slate-400 font-semibold uppercase">Import Status</p>
              <span
                className={`text-sm font-bold flex items-center gap-1.5 ${
                  previewResult.can_import ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {previewResult.can_import ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Ready to Import
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Issues Found
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-navy-850 border border-navy-700/60">
            <div className="flex items-center gap-2">
              {previewResult.issues?.length > 0 && (
                <button
                  onClick={downloadErrorReportCSV}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Error Report ({previewResult.issues.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedFile(null); setPreviewResult(null); }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-navy-800 hover:bg-navy-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmImport(true)}
                disabled={isImporting || !previewResult.can_import}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 disabled:bg-navy-700 disabled:text-slate-500 text-white shadow-lg shadow-teal-900/30 flex items-center gap-2"
              >
                {isImporting ? (
                  'Importing Records...'
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Confirm & Import Valid Records
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Notification */}
          {importSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold text-sm">{importSuccess.message}</p>
                <p className="text-emerald-400/80 mt-0.5">
                  Dashboard charts and loan records have been updated automatically.
                </p>
              </div>
            </div>
          )}

          {/* Preview Table (First 10 records) */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              Uploaded File Preview (First 10 Rows)
            </h3>
            <DataTable
              columns={previewColumns}
              data={previewResult.preview_rows}
              emptyMessage="No rows in uploaded file."
            />
          </div>

          {/* Validation Issues Table */}
          {previewResult.issues?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Detected Validation Issues ({previewResult.issues.length})
              </h3>
              <DataTable
                columns={issueColumns}
                data={previewResult.issues}
                emptyMessage="No validation issues detected."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
