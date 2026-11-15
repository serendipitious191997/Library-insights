import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { LoansAPI, BooksAPI } from '../services/api';

const CATEGORIES = [
  'Computer Science',
  'Mathematics',
  'Electronics',
  'Physics',
  'Mechanical Engineering',
  'Chemistry',
];

const STATUSES = ['Active', 'Returned', 'Overdue'];

export default function Loans() {
  const [searchParams] = useSearchParams();
  const [loans, setLoans] = useState([]);
  const [booksList, setBooksList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [formData, setFormData] = useState({
    loan_id: '',
    book_id: '',
    student_id: '',
    borrow_date: '',
    due_date: '',
    return_date: '',
    status: 'Active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm Dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const res = await LoansAPI.getAll({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        status: status !== 'All' ? status : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        skip: 0,
        limit: 500, // get full filtered set to paginate locally
      });
      setLoans(res.data || []);
    } catch (err) {
      toast.error(`Error loading loans: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await BooksAPI.getAll();
      setBooksList(res.data || []);
    } catch (err) {
      console.warn('Books list fetch failed:', err.message);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [search, category, status, startDate, endDate]);

  const openAddModal = () => {
    setEditingLoan(null);
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setFormData({
      loan_id: '',
      book_id: booksList.length > 0 ? booksList[0].book_id : '',
      student_id: '',
      borrow_date: today,
      due_date: due,
      return_date: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (loan) => {
    setEditingLoan(loan);
    setFormData({
      loan_id: loan.loan_id,
      book_id: loan.book_id,
      student_id: loan.student_id,
      borrow_date: loan.borrow_date,
      due_date: loan.due_date,
      return_date: loan.return_date || '',
      status: loan.status,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.book_id) {
      toast.error('Please select a book.');
      return;
    }
    if (!formData.student_id.trim()) {
      toast.error('Student ID is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingLoan) {
        await LoansAPI.update(editingLoan.loan_id, {
          student_id: formData.student_id.trim(),
          borrow_date: formData.borrow_date,
          due_date: formData.due_date,
          return_date: formData.return_date || null,
          status: formData.status,
        });
        toast.success(`Loan '${editingLoan.loan_id}' updated successfully.`);
      } else {
        await LoansAPI.create({
          loan_id: formData.loan_id.trim() || undefined,
          book_id: formData.book_id,
          student_id: formData.student_id.trim(),
          borrow_date: formData.borrow_date,
          due_date: formData.due_date,
          return_date: formData.return_date || null,
          status: formData.status,
        });
        toast.success('New borrowing transaction created.');
      }
      setIsModalOpen(false);
      fetchLoans();
      fetchBooks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (loan) => {
    setLoanToDelete(loan);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;
    setIsDeleting(true);
    try {
      await LoansAPI.delete(loanToDelete.loan_id);
      toast.success(`Loan record '${loanToDelete.loan_id}' deleted.`);
      setIsDeleteOpen(false);
      fetchLoans();
      fetchBooks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const paginatedData = loans.slice((page - 1) * pageSize, page * pageSize);

  const columns = [
    {
      header: 'Loan ID',
      accessor: 'loan_id',
      render: (r) => <span className="font-mono text-xs font-semibold text-teal-400">{r.loan_id}</span>,
    },
    {
      header: 'Book ID',
      accessor: 'book_id',
      render: (r) => <span className="font-mono text-xs text-slate-400">{r.book_id}</span>,
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
      header: 'Return Date',
      accessor: 'return_date',
      render: (r) => (
        r.return_date ? (
          <span className="text-slate-300">{r.return_date}</span>
        ) : (
          <span className="text-xs text-slate-500 italic">Not Returned</span>
        )
      ),
    },
    {
      header: 'Duration',
      accessor: 'loan_duration',
      render: (r) => (
        r.loan_duration !== null ? (
          <span className="font-semibold text-teal-400 text-xs">{r.loan_duration} days</span>
        ) : (
          <span className="text-xs text-slate-500">—</span>
        )
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge status={r.status} isOverdue={r.is_overdue} isLate={r.is_returned_late} />,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEditModal(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-navy-800 transition-colors"
            title="Edit Loan Record"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => confirmDelete(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-navy-800 transition-colors"
            title="Delete Loan Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Circulation Loan Records
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, edit and track borrowing transactions across students and departments.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Loan
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-navy-850 p-4 rounded-2xl border border-navy-700/60 space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <SearchBar
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search by Loan ID, Student ID, or Book Title..."
            categories={CATEGORIES}
            selectedCategory={category}
            onCategoryChange={(val) => { setCategory(val); setPage(1); }}
            statuses={STATUSES}
            selectedStatus={status}
            onStatusChange={(val) => { setStatus(val); setPage(1); }}
          />
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-navy-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Borrow Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-navy-800 border border-navy-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-navy-800 border border-navy-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {(search || category !== 'All' || status !== 'All' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setStatus('All');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium underline underline-offset-2 ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loans Table */}
      <DataTable
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={loans.length}
        onPageChange={setPage}
        emptyMessage="No loan records matching the specified criteria."
      />

      {/* Add / Edit Loan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLoan ? `Edit Loan: ${editingLoan.loan_id}` : 'Create New Loan Record'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {!editingLoan && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Loan ID (Optional - auto-generated if left blank)
              </label>
              <input
                type="text"
                value={formData.loan_id}
                onChange={(e) => setFormData({ ...formData, loan_id: e.target.value })}
                placeholder="e.g. LN-1051"
                className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Book <span className="text-rose-400">*</span>
            </label>
            <select
              value={formData.book_id}
              onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
              disabled={!!editingLoan}
              className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-60"
            >
              {booksList.map((b) => (
                <option key={b.book_id} value={b.book_id}>
                  {b.book_id} - {b.title} ({b.available_copies} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Student ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              placeholder="e.g. STU-1055"
              required
              className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Borrow Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={formData.borrow_date}
                onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })}
                required
                className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>

          {editingLoan && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Return Date (Leave blank if active)
              </label>
              <input
                type="date"
                value={formData.return_date}
                onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-700/60">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-navy-800 hover:bg-navy-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 flex items-center gap-2"
            >
              {isSubmitting ? 'Saving...' : editingLoan ? 'Save Changes' : 'Issue Loan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Borrowing Record"
        message={`Are you sure you want to delete loan transaction '${loanToDelete?.loan_id}'? If active, the book copy will be returned to inventory.`}
        confirmText="Delete Loan"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
