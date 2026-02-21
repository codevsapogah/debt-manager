import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { useIsDesktop } from '../../hooks/useMediaQuery';

export default function AppLayout() {
  const location = useLocation();
  const isDesktop = useIsDesktop();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-family)',
        display: isDesktop ? 'flex' : 'block',
      }}
    >
      {isDesktop ? (
        <>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      ) : (
        <>
          <AppHeader />
          <main style={{ paddingBottom: 80 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          <BottomNav />
        </>
      )}
    </div>
  );
}
