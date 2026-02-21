import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-family)',
      }}
    >
      <AppHeader />
      <main style={{ paddingBottom: 80 }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
