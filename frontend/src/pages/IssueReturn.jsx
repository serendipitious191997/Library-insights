import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  PlusCircle,
  RotateCcw,
  BookOpen,
  User,
  Calendar,
  Search,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

import StatusBadge from '../components/StatusBadge';
import { BooksAPI, LoansAPI, SettingsAPI } from '../services/api';

export default function IssueReturn() {
  const [books, setBooks] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Issue Form State
  const [issueBookId, setIssueBookId] = useState('');
  const [issueStudentId, setIssueStudentId] = useState('');
  const [issueBorrowDate, setIssueBorrowDate] = useState('');
  const [issueDueDate, setIssueDueDate] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  // Return Search & Action State
  const [returnQuery, setReturnQuery] = useState('');
  const [selectedLoanToReturn, setSelectedLoanToReturn] = useState(null);
  const [customReturnDate, setCustomReturnDate] = useState('');
  const [isReturning, setIsReturning] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resBooks, resLoans, resSettings] = await Promise.all([
        BooksAPI.getAll(),
        LoansAPI.getAll({ status: 'Active', limit: 100 }),
        SettingsAPI.get(),
      ]);

      const bData = resBooks.data || [];
      setBooks(bData);
      setActiveLoans(resLoans.data || []);

      const effDate = resSettings.data?.effective_date || new Date().toISOString().split('T')[0];
      const loanDays = resSettings.data?.default_loan_days || 14;

      setIssueBorrowDate(effDate);
      const borrowD = new Date(effDate + 'T00:00:00');
      const dueD = new Date(borrowD.getTime() + loanDays * 86400000);
      setIssueDueDate(dueD.toISOString().split('T')[0]);
      setCustomReturnDate(effDate);

      if (bData.length > 0 && !issueBookId) {
        setIssueBookId(bData[0].book_id);
      }
    } catch (err) {
      toast.error(`Initialization error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueBookId) {
      toast.error('Please select a book.');
      return;
    }
    if (!issueStudentId.trim()) {
      toast.error('Student ID is required.');
      return;
    }

    const selectedBook = books.find((b) => b.book_id === issueBookId);
    if (selectedBook && selectedBook.available_copies <= 0) {
      toast.error(`Cannot issue '${selectedBook.title}': 0 copies available.`);
      return;
    }

    setIsIssuing(true);
    try {
      const res = await LoansAPI.issue({
        book_id: issueBookId,
        student_id: issueStudentId.trim(),
        borrow_date: issueBorrowDate,
        due_date: issueDueDate,
      });

      toast.success(
        `Book successfully issued! Loan ID: ${res.data.loan_id}. Inventory updated.`,
        { duration: 4000 }
      );
      setIssueStudentId('');
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleReturnAction = async () => {
    if (!selectedLoanToReturn) return;

    setIsReturning(true);
    try {
      const payload = customReturnDate ? { return_date: customReturnDate } : {};
      const res = await LoansAPI.returnBook(selectedLoanToReturn.loan_id, payload);

      toast.success(
        `Loan '${selectedLoanToReturn.loan_id}' marked as Returned! Duration: ${res.data.loan_duration} days. Inventory replenished.`,
        { duration: 4000 }
      );
      setSelectedLoanToReturn(null);
      setReturnQuery('');
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsReturning(false);
    }
  };

  // Filter active loans for quick return search
  const filteredActiveLoans = activeLoans.filter((l) => {
    if (!returnQuery.trim()) return true;
    const q = returnQuery.toLowerCase();
    return (
      l.loan_id.toLowerCase().includes(q) ||
      l.student_id.toLowerCase().includes(q) ||
      l.book_title.toLowerCase().includes(q) ||
      l.book_id.toLowerCase().includes(q)
    );
  });

  const selectedBookMeta = books.find((b) => b.book_id === issueBookId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-navy-700/60">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Issue & Return Management
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Perform check-outs, process book returns, calculate durations, and auto-restock shelf inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= SECTION A: ISSUE BOOK ================= */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-navy-700/60 mb-5">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Issue Book Copy</h3>
                <p className="text-xs text-slate-400">Validate stock and create a new active checkout transaction</p>
              </div>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              {/* Select Book */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Select Book from Catalog <span className="text-rose-400">*</span></span>
                  {selectedBookMeta && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        selectedBookMeta.available_copies > 0
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}
                    >
                      {selectedBookMeta.available_copies} of {selectedBookMeta.total_copies} available
                    </span>
                  )}
                </label>
                <select
                  value={issueBookId}
                  onChange={(e) => setIssueBookId(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  {books.map((b) => (
                    <option key={b.book_id} value={b.book_id}>
                      [{b.book_id}] {b.title} — ({b.available_copies} in stock)
                    </option>
                  ))}
                </select>
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student ID <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={issueStudentId}
                    onChange={(e) => setIssueStudentId(e.target.value)}
                    placeholder="Enter student registration ID (e.g. STU-1088)..."
                    required
                    className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Borrow Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={issueBorrowDate}
                    onChange={(e) => setIssueBorrowDate(e.target.value)}
                    required
                    className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Due Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={issueDueDate}
                    onChange={(e) => setIssueDueDate(e.target.value)}
                    required
                    className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isIssuing || (selectedBookMeta && selectedBookMeta.available_copies <= 0)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 disabled:bg-navy-700 disabled:text-slate-500 text-white shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2"
                >
                  {isIssuing ? (
                    'Processing Checkout...'
                  ) : selectedBookMeta && selectedBookMeta.available_copies <= 0 ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Issue Book Copy
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-navy-800/40 border border-navy-700/40 text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
            <span>Issuing automatically reduces shelf stock by 1 and records the borrow transaction.</span>
          </div>
        </div>

        {/* ================= SECTION B: RETURN BOOK ================= */}
        <div className="bg-navy-850 border border-navy-700/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-navy-700/60 mb-5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Record Book Return</h3>
                <p className="text-xs text-slate-400">Search active loan, calculate loan duration, and restock inventory</p>
              </div>
            </div>

            {/* Quick Search for Active Loan */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Search Active Borrowings
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={returnQuery}
                  onChange={(e) => setReturnQuery(e.target.value)}
                  placeholder="Filter by Loan ID, Student ID, or Book Title..."
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              {/* Selected Loan Details Card */}
              {selectedLoanToReturn ? (
                <div className="p-4 rounded-xl bg-navy-800/80 border border-cyan-500/40 space-y-3 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {selectedLoanToReturn.loan_id}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">
                        {selectedLoanToReturn.book_title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Student: <strong className="text-slate-200">{selectedLoanToReturn.student_id}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedLoanToReturn(null)}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-navy-700/60">
                    <div>
                      <span className="text-slate-400">Borrowed:</span>{' '}
                      <span className="text-white font-medium">{selectedLoanToReturn.borrow_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Due Date:</span>{' '}
                      <span className="text-white font-medium">{selectedLoanToReturn.due_date}</span>
                    </div>
                  </div>

                  {/* Return Date Input */}
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={customReturnDate}
                      onChange={(e) => setCustomReturnDate(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <button
                    onClick={handleReturnAction}
                    disabled={isReturning}
                    className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isReturning ? 'Processing Return...' : 'Mark as Returned & Restock'}
                  </button>
                </div>
              ) : (
                /* Active Loans List for Quick Selection */
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filteredActiveLoans.length > 0 ? (
                    filteredActiveLoans.slice(0, 10).map((l) => (
                      <div
                        key={l.loan_id}
                        onClick={() => setSelectedLoanToReturn(l)}
                        className="p-3 rounded-xl bg-navy-800/40 hover:bg-navy-800 border border-navy-700/40 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-teal-400 font-semibold">{l.loan_id}</span>
                            <span className="text-xs text-slate-400">[{l.student_id}]</span>
                            {l.is_overdue && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-semibold">
                                Overdue
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white truncate font-medium mt-0.5">{l.book_title}</p>
                        </div>
                        <span className="text-xs text-cyan-400 shrink-0 font-medium">Select</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No matching active loans found.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-navy-800/40 border border-navy-700/40 text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
            <span>Marking as returned updates status, calculates loan duration, and returns +1 copy to stock.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
