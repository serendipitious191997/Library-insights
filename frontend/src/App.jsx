import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Loans from './pages/Loans';
import IssueReturn from './pages/IssueReturn';
import Overdue from './pages/Overdue';
import Analytics from './pages/Analytics';
import ImportData from './pages/ImportData';
import Validation from './pages/Validation';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="books" element={<Books />} />
          <Route path="loans" element={<Loans />} />
          <Route path="issue-return" element={<IssueReturn />} />
          <Route path="overdue" element={<Overdue />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="import" element={<ImportData />} />
          <Route path="validation" element={<Validation />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
