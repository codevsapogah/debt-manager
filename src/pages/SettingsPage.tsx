import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { exportToCSV, exportToJSON } from '../utils/export';
import { Sun, Moon, Globe, Download, LogOut, User } from 'lucide-react';

/* ─── helper sub-components ─── */

const SettingRow = ({
  label,
  children,
  onClick,
}: {
  label: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}
    </div>
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-tertiary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginTop: 24,
      marginBottom: 8,
    }}
  >
    {title}
  </div>
);

/* ─── pill-button group ─── */

interface PillOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const PillGroup = ({
  options,
  value,
  onChange,
}: {
  options: PillOption[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div style={{ display: 'flex', gap: 4, borderRadius: 8, overflow: 'hidden' }}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-family)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: active ? 'var(--accent)' : 'var(--bg-input)',
            color: active ? '#FFFFFF' : 'var(--text-tertiary)',
          }}
        >
          {opt.icon}
          {opt.label}
        </button>
      );
    })}
  </div>
);

/* ─── main page ─── */

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useAuth();
  const { debts } = useData();

  /* theme */
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('klaro-theme') as 'dark' | 'light') || 'dark',
  );

  const toggleTheme = (newTheme: string) => {
    const theme = newTheme as 'dark' | 'light';
    setThemeMode(theme);
    localStorage.setItem('klaro-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  /* language */
  const [language, setLanguage] = useState<string>(
    () => localStorage.getItem('klaro-lang') || i18n.language || 'en',
  );

  const changeLanguage = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
    localStorage.setItem('klaro-lang', lng);
  };

  /* currency */
  const [currency, setCurrency] = useState<string>(
    () => localStorage.getItem('klaro-currency') || 'KZT',
  );

  const changeCurrency = (cur: string) => {
    setCurrency(cur);
    localStorage.setItem('klaro-currency', cur);
  };

  /* avatar helpers */
  const displayName = currentUser?.displayName || 'User';
  const email = currentUser?.email || '';
  const photoURL = currentUser?.photoURL;

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      {/* ── Title ── */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
        }}
      >
        {t('navigation.settings')}
      </h1>

      {/* ── APPEARANCE ── */}
      <SectionTitle title={t('settings.appearance')} />

      <SettingRow label={t('settings.theme')}>
        <PillGroup
          value={themeMode}
          onChange={toggleTheme}
          options={[
            { label: t('settings.dark'), value: 'dark', icon: <Moon size={14} /> },
            { label: t('settings.light'), value: 'light', icon: <Sun size={14} /> },
          ]}
        />
      </SettingRow>

      {/* ── LANGUAGE ── */}
      <SectionTitle title={t('settings.language')} />

      <SettingRow label={t('settings.language')}>
        <PillGroup
          value={language}
          onChange={changeLanguage}
          options={[
            { label: 'English', value: 'en', icon: <Globe size={14} /> },
            { label: 'Русский', value: 'ru', icon: <Globe size={14} /> },
          ]}
        />
      </SettingRow>

      {/* ── CURRENCY ── */}
      <SectionTitle title={t('settings.currency')} />

      <SettingRow label={t('settings.currency')}>
        <PillGroup
          value={currency}
          onChange={changeCurrency}
          options={[
            { label: '₸ KZT', value: 'KZT' },
            { label: '$ USD', value: 'USD' },
            { label: '€ EUR', value: 'EUR' },
          ]}
        />
      </SettingRow>

      {/* ── DATA ── */}
      <SectionTitle title={t('settings.data')} />

      <SettingRow label={t('settings.exportCSV')} onClick={() => exportToCSV(debts)}>
        <Download size={18} color="var(--text-tertiary)" />
      </SettingRow>

      <SettingRow label={t('settings.exportJSON')} onClick={() => exportToJSON(debts)}>
        <Download size={18} color="var(--text-tertiary)" />
      </SettingRow>

      {/* ── ACCOUNT ── */}
      <SectionTitle title={t('settings.account')} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 0',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={20} color="var(--accent)" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-tertiary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {email}
          </div>
        </div>
      </div>

      {/* sign-out button */}
      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: 'var(--error-bg)',
          color: 'var(--error)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-family)',
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <LogOut size={18} />
        {t('settings.signOut')}
      </button>
    </div>
  );
}
