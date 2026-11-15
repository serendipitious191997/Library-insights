import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Database,
  Calendar,
  Shield,
  Palette,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import ConfirmDialog from '../components/ConfirmDialog';
import { SettingsAPI } from '../services/api';

export default function Settings() {
  const { refreshGlobalSettings } = useOutletContext() || {};
  const [settings, setSettings] = useState({
    library_name: '',
    admin_name: '',
    default_loan_days: 14,
    reference_date: '',
    effective_date: '',
    theme: 'dark',
    total_books: 0,
    total_loans: 0,
    database_file: 'library.db',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Reset dialog state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await SettingsAPI.get();
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      toast.error(`Error loading settings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await SettingsAPI.update({
        library_name: settings.library_name.trim(),
        admin_name: settings.admin_name.trim(),
        default_loan_days: parseInt(settings.default_loan_days, 10),
        reference_date: settings.reference_date.trim() || null,
        theme: settings.theme,
      });
      setSettings(res.data);
      toast.success('Configuration settings saved successfully.');
      if (refreshGlobalSettings) refreshGlobalSettings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDataset = async () => {
    setIsResetting(true);
    try {
      const res = await SettingsAPI.resetData();
      toast.success(res.data.message || 'Sample dataset reset successfully.');
      setIsResetOpen(false);
      fetchSettings();
      if (refreshGlobalSettings) refreshGlobalSettings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-navy-700/60">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          System & Circulation Settings
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure library parameters, administrator profile, reference date conventions, and database state.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 bg-navy-850 border border-navy-700/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-base font-bold text-white pb-3 border-b border-navy-700/60 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400" />
              General Library Preferences
            </h3>

            {/* Library Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Library Name
              </label>
              <input
                type="text"
                value={settings.library_name}
                onChange={(e) => setSettings({ ...settings, library_name: e.target.value })}
                required
                className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            {/* Admin Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrator Display Name
              </label>
              <input
                type="text"
                value={settings.admin_name}
                onChange={(e) => setSettings({ ...settings, admin_name: e.target.value })}
                required
                className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Default Loan Days */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Loan Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={settings.default_loan_days}
                  onChange={(e) => setSettings({ ...settings, default_loan_days: e.target.value })}
                  required
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              {/* Theme Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  Theme Preference
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="dark">Professional Dark Navy (Active)</option>
                  <option value="slate">Slate Charcoal</option>
                </select>
              </div>
            </div>

            {/* Reference Date Convention */}
            <div className="pt-2 border-t border-navy-700/60">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                Deterministic Reference Date (Optional)
              </label>
              <p className="text-xs text-slate-400 mb-2">
                For consistent college laboratory demo verification, overdue evaluations can pin against a fixed reference date (e.g. <code>2026-05-15</code>), or left empty to use live system date.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={settings.reference_date || ''}
                  onChange={(e) => setSettings({ ...settings, reference_date: e.target.value })}
                  className="bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, reference_date: '' })}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Clear (Use Today's Date)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-navy-700/60">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving Changes...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Database State & Reset Section */}
        <div className="space-y-6">
          {/* Database Info Card */}
          <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-navy-700/60">
              <Database className="w-4 h-4 text-cyan-400" />
              Database Status
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-semibold text-white">SQLite 3 + SQLAlchemy ORM</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Database File:</span>
                <span className="font-mono text-teal-400 font-semibold">{settings.database_file}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Total Book Records:</span>
                <span className="font-bold text-white">{settings.total_books} titles</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-navy-800">
                <span className="text-slate-400">Total Loan Records:</span>
                <span className="font-bold text-white">{settings.total_loans} transactions</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Effective Date:</span>
                <span className="font-mono text-amber-400 font-semibold">{settings.effective_date}</span>
              </div>
            </div>
          </div>

          {/* Reset Demo Dataset Card */}
          <div className="bg-navy-850 border border-rose-500/30 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold">Reset Demo Dataset</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Restores the clean, initial 50-borrowing-record college laboratory demonstration benchmark (CS: 16, Math: 12, Electronics: 9, Physics: 6).
            </p>
            <button
              type="button"
              onClick={() => setIsResetOpen(true)}
              className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Benchmark Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleResetDataset}
        title="Reset Entire Dataset?"
        message="This will re-initialize the SQLite database with the standard 50-record college project benchmark. Any newly added custom loans or books will be replaced."
        confirmText="Yes, Reset Dataset"
        isDanger={true}
        isLoading={isResetting}
      />
    </div>
  );
}
