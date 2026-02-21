import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CreditCard, Clock, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const navItems = [
  { path: '/', icon: Home, labelKey: 'navigation.home' },
  { path: '/debts', icon: CreditCard, labelKey: 'navigation.debts' },
  { path: '/activity', icon: Clock, labelKey: 'navigation.activity' },
  { path: '/settings', icon: Settings, labelKey: 'navigation.settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isDetailPage = location.pathname.startsWith('/debts/');

  if (isDetailPage) return null;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: 64,
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map(({ path, icon: Icon, labelKey }) => {
        const isActive = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path);

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              transition: 'color 0.2s',
              fontFamily: 'var(--font-family)',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500 }}>
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
