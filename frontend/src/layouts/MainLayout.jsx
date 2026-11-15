import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { SettingsAPI } from '../services/api';

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [settings, setSettings] = useState({
    library_name: 'University Central Library',
    admin_name: 'Chief Librarian',
    effective_date: null,
  });

  const loadSettings = async () => {
    try {
      const res = await SettingsAPI.get();
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.warn('Settings load warning:', err.message);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#152033',
            color: '#F8FAFC',
            border: '1px solid #1E293B',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#152033',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#152033',
            },
          },
        }}
      />

      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        adminName={settings.admin_name}
      />

      <Topbar
        isCollapsed={isCollapsed}
        effectiveDate={settings.effective_date}
        libraryName={settings.library_name}
      />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out pt-20 pb-10 px-6 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet context={{ refreshGlobalSettings: loadSettings }} />
        </div>
      </main>
    </div>
  );
}
