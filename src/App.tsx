import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import './App.css';
import './i18n/config';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './components/Login';
import AppLayout from './components/layout/AppLayout';
import GooeyCircleLoader from './components/GooeyCircleLoader';
import HomePage from './pages/HomePage';
import DebtsPage from './pages/DebtsPage';
import DebtDetailPage from './pages/DebtDetailPage';
import { useTranslation } from 'react-i18next';

// Focus trap hook for modals
function useFocusTrap(isOpen: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const modal = ref.current;
    const focusableEls = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    firstEl?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleKeyDown);
    return () => modal.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return ref;
}

function AppRoutes() {
  const { currentUser, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
      }}>
        <GooeyCircleLoader loading={true} size={100} colors={['#2563EB', '#3B82F6', '#2563EB']} />
      </div>
    );
  }

  if (!currentUser) return <Login />;

  return (
    <DataProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/debts" element={<DebtsPage />} />
          <Route path="/debts/:id" element={<DebtDetailPage />} />
          <Route path="/activity" element={<div style={{ padding: 20, color: 'var(--text-primary)' }}>Activity - Coming Soon</div>} />
          <Route path="/settings" element={<div style={{ padding: 20, color: 'var(--text-primary)' }}>Settings - Coming Soon</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

function App() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('klaro-theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('klaro-theme', themeMode);
  }, [themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const isDark = themeMode === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563EB',
          colorSuccess: isDark ? '#10B981' : '#059669',
          colorWarning: isDark ? '#F59E0B' : '#D97706',
          colorError: isDark ? '#EF4444' : '#DC2626',
          colorBgContainer: isDark ? '#111D31' : '#FFFFFF',
          colorBgElevated: isDark ? '#162540' : '#FFFFFF',
          colorBgLayout: isDark ? '#0A1628' : '#F8FAFC',
          colorBorder: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          colorBorderSecondary: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          colorText: isDark ? '#F1F5F9' : '#0F172A',
          colorTextSecondary: isDark ? '#94A3B8' : '#475569',
          colorTextTertiary: isDark ? '#64748B' : '#94A3B8',
          borderRadius: 12,
          fontSize: 14,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
        components: {
          Table: { borderRadius: 16, headerBg: isDark ? '#111D31' : '#F8FAFC' },
          Button: { borderRadius: 10, controlHeight: 40 },
          Modal: { borderRadius: 16 },
          Tag: { borderRadiusSM: 6 },
          Progress: { remainingColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
        },
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
