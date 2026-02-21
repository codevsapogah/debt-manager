import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Clock, Settings, Wallet, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/', icon: Home, labelKey: 'navigation.home' },
  { path: '/debts', icon: CreditCard, labelKey: 'navigation.debts' },
  { path: '/activity', icon: Clock, labelKey: 'navigation.activity' },
];

const manageItems = [
  { path: '/income', icon: Wallet, labelKey: 'settings.manageIncome' },
  { path: '/expenses', icon: Receipt, labelKey: 'settings.manageExpenses' },
];

const bottomItems = [
  { path: '/settings', icon: Settings, labelKey: 'navigation.settings' },
];

function NavButton({ path, isActive, onClick, children }: {
  path: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-family)',
        fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        width: '100%',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-family)',
          }}
        >
          Klaro
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ path, icon: Icon, labelKey }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

            return (
              <NavButton key={path} path={path} isActive={isActive} onClick={() => navigate(path)}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {t(labelKey)}
              </NavButton>
            );
          })}
        </div>

        {/* Manage section */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '20px 12px 8px',
          }}
        >
          {t('home.manage')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {manageItems.map(({ path, icon: Icon, labelKey }) => {
            const isActive = location.pathname === path;

            return (
              <NavButton key={path} path={path} isActive={isActive} onClick={() => navigate(path)}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {t(labelKey)}
              </NavButton>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings at bottom of nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {bottomItems.map(({ path, icon: Icon, labelKey }) => {
            const isActive = location.pathname === path;

            return (
              <NavButton key={path} path={path} isActive={isActive} onClick={() => navigate(path)}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {t(labelKey)}
              </NavButton>
            );
          })}
        </div>
      </nav>

      {/* User section at bottom */}
      {currentUser && (
        <div
          style={{
            padding: '16px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-subtle)',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.displayName || 'User'}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'var(--text-tertiary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.email}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
