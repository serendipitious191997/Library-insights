import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  BookmarkCheck,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { BooksAPI } from '../services/api';

const DEFAULT_CATEGORIES = [
  'Computer Science',
  'Mathematics',
  'Electronics',
  'Physics',
  'Mechanical Engineering',
  'Chemistry',
];

export default function Books() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    book_id: '',
    title: '',
    author: '',
    category: 'Computer Science',
    publisher: '',
    total_copies: 5,
    available_copies: 5,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const res = await BooksAPI.getAll({
        search: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        sort_by: sortBy,
        order: sortOrder,
      });
      setBooks(res.data || []);
    } catch (err) {
      toast.error(`Failed to load books: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory, sortBy, sortOrder]);

  const openAddModal = () => {
    setEditingBook(null);
    setFormData({
      book_id: '',
      title: '',
      author: '',
      category: 'Computer Science',
      publisher: '',
      total_copies: 5,
      available_copies: 5,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      book_id: book.book_id,
      title: book.title,
      author: book.author,
      category: book.category,
      publisher: book.publisher || '',
      total_copies: book.total_copies,
      available_copies: book.available_copies,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is compulsory.';
    if (!formData.author.trim()) errors.author = 'Author name is required.';
    if (!formData.category.trim()) errors.category = 'Category is required.';
    if (!formData.total_copies || parseInt(formData.total_copies, 10) < 1) {
      errors.total_copies = 'Total copies must be at least 1.';
    }
    if (
      formData.available_copies === '' ||
      parseInt(formData.available_copies, 10) < 0
    ) {
      errors.available_copies = 'Available copies must be 0 or more.';
    } else if (
      parseInt(formData.available_copies, 10) > parseInt(formData.total_copies, 10)
    ) {
      errors.available_copies = 'Available copies cannot exceed total copies.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category.trim(),
        publisher: formData.publisher.trim() || null,
        total_copies: parseInt(formData.total_copies, 10),
        available_copies: parseInt(formData.available_copies, 10),
      };

      if (editingBook) {
        await BooksAPI.update(editingBook.book_id, payload);
        toast.success(`Book '${formData.title}' updated successfully.`);
      } else {
        if (formData.book_id.trim()) {
          payload.book_id = formData.book_id.trim();
        }
        await BooksAPI.create(payload);
        toast.success(`Book '${formData.title}' added to inventory.`);
      }

      setIsModalOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (book) => {
    setBookToDelete(book);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    try {
      await BooksAPI.delete(bookToDelete.book_id);
      toast.success(`Book '${bookToDelete.title}' removed from inventory.`);
      setIsDeleteOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute inventory KPIs
  const totalTitles = books.length;
  const totalCopies = books.reduce((acc, b) => acc + (b.total_copies || 0), 0);
  const totalAvailable = books.reduce((acc, b) => acc + (b.available_copies || 0), 0);
  const totalIssued = books.reduce((acc, b) => acc + (b.issued_copies || 0), 0);

  const columns = [
    {
      header: 'Book ID',
      accessor: 'book_id',
      render: (r) => <span className="font-mono text-xs font-semibold text-teal-400">{r.book_id}</span>,
    },
    {
      header: 'Title & Author',
      accessor: 'title',
      render: (r) => (
        <div>
          <span className="font-semibold text-white block">{r.title}</span>
          <span className="text-xs text-slate-400">by {r.author}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (r) => (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-800 text-slate-300 border border-navy-700">
          {r.category}
        </span>
      ),
    },
    {
      header: 'Total Copies',
      accessor: 'total_copies',
      render: (r) => <span className="font-medium text-slate-200">{r.total_copies}</span>,
    },
    {
      header: 'Available',
      accessor: 'available_copies',
      render: (r) => (
        <span
          className={`font-semibold text-xs px-2 py-0.5 rounded-md ${
            r.available_copies === 0
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {r.available_copies} in stock
        </span>
      ),
    },
    {
      header: 'Issued Copies',
      accessor: 'issued_copies',
      render: (r) => <span className="text-xs text-slate-400">{r.issued_copies} checked out</span>,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-navy-800 transition-colors"
            title="Edit Book"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => confirmDelete(r)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-navy-800 transition-colors"
            title="Delete Book"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-navy-700/60">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Books & Inventory Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Maintain catalog records, monitor copy distribution, and prevent duplicate entries.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Book
        </button>
      </div>

      {/* Inventory KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-navy-850 border border-navy-700/60 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Titles</p>
          <p className="text-2xl font-bold text-white mt-0.5">{totalTitles}</p>
        </div>
        <div className="bg-navy-850 border border-navy-700/60 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Stock</p>
          <p className="text-2xl font-bold text-cyan-400 mt-0.5">{totalCopies} copies</p>
        </div>
        <div className="bg-navy-850 border border-navy-700/60 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase">Available on Shelf</p>
          <p className="text-2xl font-bold text-emerald-400 mt-0.5">{totalAvailable} copies</p>
        </div>
        <div className="bg-navy-850 border border-navy-700/60 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase">Currently Issued</p>
          <p className="text-2xl font-bold text-amber-400 mt-0.5">{totalIssued} copies</p>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-navy-850 p-4 rounded-2xl border border-navy-700/60">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by Title, Author, or Book ID..."
          categories={DEFAULT_CATEGORIES}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-navy-800 border border-navy-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="title">Title (Alphabetical)</option>
            <option value="book_id">Book ID</option>
            <option value="available_copies">Available Copies</option>
            <option value="total_copies">Total Copies</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-1.5 bg-navy-800 border border-navy-700/80 rounded-xl text-xs text-teal-400 font-semibold hover:bg-navy-700 transition-colors"
          >
            {sortOrder.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Books Table */}
      <DataTable
        columns={columns}
        data={books}
        isLoading={isLoading}
        emptyMessage="No books matching your query found in inventory."
      />

      {/* Add / Edit Book Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBook ? `Edit Book: ${editingBook.book_id}` : 'Add New Book to Inventory'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Book ID (Optional for new book, auto-generated if left blank)
            </label>
            <input
              type="text"
              value={formData.book_id}
              onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
              disabled={!!editingBook}
              placeholder="e.g. BK-119"
              className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Book Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Computer Networks: A Systems Approach"
              className={`w-full bg-navy-800 border rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                formErrors.title ? 'border-rose-500' : 'border-navy-700'
              }`}
            />
            {formErrors.title && <p className="text-xs text-rose-400 mt-1">{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Author <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g. Larry L. Peterson"
                className={`w-full bg-navy-800 border rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                  formErrors.author ? 'border-rose-500' : 'border-navy-700'
                }`}
              />
              {formErrors.author && <p className="text-xs text-rose-400 mt-1">{formErrors.author}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Publisher (Optional)
            </label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              placeholder="e.g. Morgan Kaufmann"
              className="w-full bg-navy-800 border border-navy-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Copies <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_copies}
                onChange={(e) => setFormData({ ...formData, total_copies: e.target.value })}
                className={`w-full bg-navy-800 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                  formErrors.total_copies ? 'border-rose-500' : 'border-navy-700'
                }`}
              />
              {formErrors.total_copies && (
                <p className="text-xs text-rose-400 mt-1">{formErrors.total_copies}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Available Copies <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.available_copies}
                onChange={(e) => setFormData({ ...formData, available_copies: e.target.value })}
                className={`w-full bg-navy-800 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                  formErrors.available_copies ? 'border-rose-500' : 'border-navy-700'
                }`}
              />
              {formErrors.available_copies && (
                <p className="text-xs text-rose-400 mt-1">{formErrors.available_copies}</p>
              )}
            </div>
          </div>

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
              {isSubmitting ? 'Saving...' : editingBook ? 'Save Changes' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Remove Book from Inventory"
        message={`Are you sure you want to delete '${bookToDelete?.title}' (${bookToDelete?.book_id})? This action cannot be undone.`}
        confirmText="Delete Book"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
