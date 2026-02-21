# Klaro Debt Manager - Full Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Klaro from a generic Ant Design app into a bold, vibrant, distinctive financial product with new navigation, transaction history, and auto-logging features.

**Architecture:** Replace tab-based navigation with React Router + bottom nav bar (4 screens: Home, Debts, Activity, Settings). Add Transaction data model to Firebase. Reduce Ant Design dependency by building custom components. Keep existing calculation engine, Firebase backend, and i18n system.

**Tech Stack:** React 19, TypeScript, React Router 7, Framer Motion, Lucide React, Recharts, Firebase, Tailwind CSS 4, Inter font

---

## Phase 1: Foundation (Dependencies, Types, Design Tokens)

### Task 1: Install New Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npm install react-router-dom framer-motion lucide-react
```

Expected: Packages installed successfully. react-router-dom, framer-motion, and lucide-react added to package.json.

**Step 2: Verify installation**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npm ls react-router-dom framer-motion lucide-react
```

Expected: All three packages listed with versions.

**Step 3: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add package.json package-lock.json
git commit -m "chore: add react-router-dom, framer-motion, lucide-react"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add Transaction and updated Debt types**

Add these new types to `src/types/index.ts`:

```typescript
export interface Transaction {
  id: string;
  debtId: string;
  amount: number;
  date: Date;
  type: 'manual' | 'recurring';
  note?: string;
  balanceAfter: number;
}

// Add to existing Debt interface:
// autoLog?: boolean;
// autoLogDay?: number;        // 1-28
// autoLogAmount?: number;     // defaults to monthlyPayment
// lastAutoLogDate?: Date;     // tracks last auto-log
```

Specifically, modify the existing `Debt` interface to add four optional fields at the end:
```typescript
export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentAmount: number;
  interestRate: number;
  dateStarted: Date;
  monthlyPayment?: number;
  duration?: number;
  includeInTotal?: boolean;
  autoLog?: boolean;
  autoLogDay?: number;
  autoLogAmount?: number;
  lastAutoLogDate?: Date;
}
```

Also update `AppState`:
```typescript
export interface AppState {
  debts: Debt[];
  incomeSources: IncomeSource[];
  recurringExpenses?: RecurringExpense[];
  transactions?: Transaction[];
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npx tsc --noEmit 2>&1 | head -20
```

Expected: No new errors (existing errors are fine, no new ones from our type changes).

**Step 3: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/types/index.ts
git commit -m "feat: add Transaction type and auto-log fields to Debt"
```

---

### Task 3: Replace Design Tokens (CSS Variables)

**Files:**
- Modify: `src/index.css` - Replace font imports and CSS variables
- Modify: `src/App.css` - Replace all `:root` design tokens

**Step 1: Update `src/index.css`**

Replace the font imports at the top with Inter font. Replace ALL existing CSS variables in `:root` and `[data-theme="light"]` with the new "Bold Finance" palette:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  /* Bold Finance Palette - Dark Mode (default) */
  --bg-primary: #0A1628;
  --bg-surface: #111D31;
  --bg-surface-hover: #162540;
  --bg-card: #13243D;
  --bg-input: #0F1D33;

  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-tertiary: #64748B;
  --text-muted: #475569;

  --accent: #2563EB;
  --accent-hover: #3B82F6;
  --accent-subtle: rgba(37, 99, 235, 0.12);
  --accent-glow: rgba(37, 99, 235, 0.3);

  --coral: #FF6154;
  --coral-bg: rgba(255, 97, 84, 0.12);
  --success: #10B981;
  --success-bg: rgba(16, 185, 129, 0.12);
  --warning: #F59E0B;
  --warning-bg: rgba(245, 158, 11, 0.12);
  --error: #EF4444;
  --error-bg: rgba(239, 68, 68, 0.12);

  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);

  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}

[data-theme="light"] {
  --bg-primary: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-surface-hover: #F1F5F9;
  --bg-card: #FFFFFF;
  --bg-input: #F8FAFC;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #94A3B8;
  --text-muted: #CBD5E1;

  --accent: #2563EB;
  --accent-hover: #1D4ED8;
  --accent-subtle: rgba(37, 99, 235, 0.08);
  --accent-glow: rgba(37, 99, 235, 0.15);

  --coral: #EF4444;
  --coral-bg: rgba(239, 68, 68, 0.08);
  --success: #059669;
  --success-bg: rgba(5, 150, 105, 0.08);
  --warning: #D97706;
  --warning-bg: rgba(217, 119, 6, 0.08);
  --error: #DC2626;
  --error-bg: rgba(220, 38, 38, 0.08);

  --border-subtle: rgba(0, 0, 0, 0.04);
  --border-default: rgba(0, 0, 0, 0.08);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
}
```

Keep the base element styles but update them to use `var(--font-family)` instead of the old font references.

**Step 2: Update `src/App.css` root variables**

Remove the duplicate `:root` and `[data-theme="light"]` blocks from App.css (they're now in index.css). Keep all the component-specific styles for now - they'll be replaced in later tasks.

**Step 3: Verify the app still renders**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npm start &
sleep 10
curl -s http://localhost:3000 | head -5
kill %1
```

Expected: App starts without crash. Some visual breakage is expected since old variable names are being used by components - that's fine, we'll fix them.

**Step 4: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/index.css src/App.css
git commit -m "feat: replace design tokens with Bold Finance palette"
```

---

## Phase 2: Firebase Storage for Transactions

### Task 4: Add Transaction CRUD to Firebase Storage

**Files:**
- Modify: `src/utils/firebaseStorage.ts`

**Step 1: Add transaction Firestore functions**

Add the following to `src/utils/firebaseStorage.ts`:

```typescript
// At the top, after existing collection getters:
const getUserTransactionsCollection = (userId: string) =>
  collection(db, 'users', userId, 'transactions');

// Transaction CRUD operations
export const loadTransactionsFromFirestore = async (
  userId: string,
  debtId?: string
): Promise<Transaction[]> => {
  try {
    let q;
    if (debtId) {
      q = query(
        getUserTransactionsCollection(userId),
        where('debtId', '==', debtId),
        orderBy('date', 'desc')
      );
    } else {
      q = query(
        getUserTransactionsCollection(userId),
        orderBy('date', 'desc')
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      date: doc.data().date.toDate(),
    })) as Transaction[];
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

export const addTransactionToFirestore = async (
  userId: string,
  transaction: Transaction
): Promise<void> => {
  try {
    const txRef = doc(getUserTransactionsCollection(userId), transaction.id);
    await setDoc(txRef, transaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const deleteTransactionFromFirestore = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  try {
    const txRef = doc(getUserTransactionsCollection(userId), transactionId);
    await deleteDoc(txRef);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const updateTransactionInFirestore = async (
  userId: string,
  transaction: Transaction
): Promise<void> => {
  try {
    const txRef = doc(getUserTransactionsCollection(userId), transaction.id);
    await updateDoc(txRef, transaction as any);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};
```

Also add `where` to the Firestore imports at the top of the file:
```typescript
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, orderBy, writeBatch, where } from 'firebase/firestore';
```

And add `Transaction` to the types import:
```typescript
import { AppState, Debt, IncomeSource, RecurringExpense, Transaction } from '../types';
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npx tsc --noEmit 2>&1 | head -20
```

Expected: No new errors.

**Step 3: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/utils/firebaseStorage.ts
git commit -m "feat: add transaction CRUD operations to Firebase storage"
```

---

### Task 5: Add Transaction Functions to localStorage Storage

**Files:**
- Modify: `src/utils/storage.ts`

**Step 1: Add transaction localStorage functions**

Add to `src/utils/storage.ts`:

```typescript
// Import Transaction type
import { AppState, Debt, IncomeSource, RecurringExpense, Transaction } from '../types';

// Add new storage key
const TRANSACTIONS_STORAGE_KEY = 'klaro-transactions';

// Transaction localStorage operations
export const loadTransactions = (debtId?: string): Transaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) return [];
    const transactions: Transaction[] = JSON.parse(raw, (key, value) => {
      if (key === 'date' || key === 'lastAutoLogDate') {
        return new Date(value);
      }
      return value;
    });
    if (debtId) {
      return transactions.filter(t => t.debtId === debtId);
    }
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
};

export const addTransaction = async (
  transaction: Transaction,
  userId?: string
): Promise<void> => {
  // Save to localStorage
  const transactions = loadTransactions();
  transactions.unshift(transaction);
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));

  // Sync to Firebase
  if (userId) {
    try {
      const { addTransactionToFirestore } = await import('./firebaseStorage');
      await addTransactionToFirestore(userId, transaction);
    } catch (error) {
      console.error('Failed to sync transaction to Firebase:', error);
    }
  }
};

export const deleteTransaction = async (
  transactionId: string,
  userId?: string
): Promise<void> => {
  const transactions = loadTransactions();
  const filtered = transactions.filter(t => t.id !== transactionId);
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(filtered));

  if (userId) {
    try {
      const { deleteTransactionFromFirestore } = await import('./firebaseStorage');
      await deleteTransactionFromFirestore(userId, transactionId);
    } catch (error) {
      console.error('Failed to delete transaction from Firebase:', error);
    }
  }
};
```

**Step 2: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/utils/storage.ts
git commit -m "feat: add transaction localStorage operations"
```

---

## Phase 3: Routing & Layout Shell

### Task 6: Set Up React Router and App Shell

**Files:**
- Modify: `src/index.tsx` - Wrap app with BrowserRouter
- Modify: `src/App.tsx` - Replace tab nav with React Router routes
- Create: `src/components/layout/BottomNav.tsx` - Bottom navigation bar
- Create: `src/components/layout/AppHeader.tsx` - Slim header with logo and avatar
- Create: `src/components/layout/AppLayout.tsx` - Layout wrapper with header, content area, and bottom nav

**Step 1: Update `src/index.tsx`**

Add BrowserRouter wrapper around App:

```typescript
import { BrowserRouter } from 'react-router-dom';

// Wrap <App /> with <BrowserRouter>:
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

**Step 2: Create `src/components/layout/BottomNav.tsx`**

```tsx
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

  // Don't show on debt detail pages
  const isDetailPage = location.pathname.startsWith('/debts/');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        height: 64,
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: isDetailPage ? 'none' : 'flex',
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
            className="flex flex-col items-center justify-center gap-0.5 border-0 bg-transparent cursor-pointer"
            style={{
              flex: 1,
              height: '100%',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              transition: 'color 0.2s',
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
```

**Step 3: Create `src/components/layout/AppHeader.tsx`**

```tsx
import { useAuth } from '../../contexts/AuthContext';

export default function AppHeader() {
  const { currentUser } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4"
      style={{
        height: 56,
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        Klaro
      </span>

      {currentUser?.photoURL && (
        <img
          src={currentUser.photoURL}
          alt="Profile"
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-full)',
            objectFit: 'cover',
          }}
        />
      )}
    </header>
  );
}
```

**Step 4: Create `src/components/layout/AppLayout.tsx`**

```tsx
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
```

**Step 5: Rewrite `src/App.tsx` with React Router**

Replace the entire AppContent function body with a React Router setup. The new App.tsx should:

1. Keep the `useFocusTrap` hook
2. Keep the theme state and ConfigProvider
3. Keep AuthProvider
4. Replace tab-based navigation with `<Routes>`:
   - `/` → HomePage (placeholder div for now)
   - `/debts` → DebtsPage (placeholder)
   - `/debts/:id` → DebtDetailPage (placeholder)
   - `/activity` → ActivityPage (placeholder)
   - `/settings` → SettingsPage (placeholder)
5. Use `AppLayout` as the layout route
6. Keep the Login screen for unauthenticated users
7. Move all data loading logic into a new `src/contexts/DataContext.tsx` (see Task 7)

The new structure:

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import AppLayout from './components/layout/AppLayout';
import Login from './components/Login';
// Page imports will be added in later tasks

function AppRoutes() {
  const { currentUser } = useAuth();

  if (!currentUser) return <Login />;

  return (
    <DataProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Home - Coming Soon</div>} />
          <Route path="/debts" element={<div>Debts - Coming Soon</div>} />
          <Route path="/debts/:id" element={<div>Debt Detail - Coming Soon</div>} />
          <Route path="/activity" element={<div>Activity - Coming Soon</div>} />
          <Route path="/settings" element={<div>Settings - Coming Soon</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

// Keep the outer App function with theme and ConfigProvider
```

**Step 6: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/index.tsx src/App.tsx src/components/layout/
git commit -m "feat: add React Router with bottom nav and app layout shell"
```

---

### Task 7: Create DataContext for Centralized State

**Files:**
- Create: `src/contexts/DataContext.tsx`

**Step 1: Create DataContext**

This context replaces the state management that was in AppContent. It provides debts, incomes, expenses, and transactions to all pages.

```tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Debt, IncomeSource, RecurringExpense, Transaction } from '../types';
import { loadFromStorage, bulkDeleteDebts, bulkUpdateDebts } from '../utils/storage';
import {
  loadFromFirestore,
  migrateLocalStorageToFirestore,
  bulkDeleteDebtsFromFirestore,
  bulkUpdateDebtsInFirestore,
  loadTransactionsFromFirestore,
} from '../utils/firebaseStorage';

interface DataContextType {
  debts: Debt[];
  incomes: IncomeSource[];
  expenses: RecurringExpense[];
  transactions: Transaction[];
  loading: boolean;
  refreshData: () => Promise<void>;
  refreshTransactions: (debtId?: string) => Promise<void>;
  optimisticDeleteDebts: (ids: string[]) => void;
  optimisticUpdateDebts: (ids: string[], updates: Partial<Debt>) => void;
  syncDebtChanges: (action: 'delete' | 'update', ids: string[], updates?: Partial<Debt>) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const localData = loadFromStorage();
      setDebts(localData.debts);
      setIncomes(localData.incomeSources);
      setExpenses(localData.recurringExpenses || []);

      if (currentUser) {
        try {
          const data = await loadFromFirestore(currentUser.uid);
          setDebts(data.debts);
          setIncomes(data.incomeSources);
          if (data.recurringExpenses && data.recurringExpenses.length > 0) {
            setExpenses(data.recurringExpenses);
          }
          const txs = await loadTransactionsFromFirestore(currentUser.uid);
          setTransactions(txs);
        } catch (error) {
          console.error('Error loading from Firestore:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const refreshTransactions = useCallback(async (debtId?: string) => {
    if (!currentUser) return;
    try {
      const txs = await loadTransactionsFromFirestore(currentUser.uid, debtId);
      if (debtId) {
        // Merge: replace transactions for this debt, keep others
        setTransactions(prev => [
          ...prev.filter(t => t.debtId !== debtId),
          ...txs,
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        setTransactions(txs);
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {
      if (currentUser) {
        try {
          await migrateLocalStorageToFirestore(currentUser.uid);
        } catch {}
      }
      await loadData();
    };
    init();
  }, [currentUser, loadData]);

  const optimisticDeleteDebts = (ids: string[]) => {
    setDebts(prev => prev.filter(d => !ids.includes(d.id)));
  };

  const optimisticUpdateDebts = (ids: string[], updates: Partial<Debt>) => {
    setDebts(prev => prev.map(d => ids.includes(d.id) ? { ...d, ...updates } : d));
  };

  const syncDebtChanges = async (action: 'delete' | 'update', ids: string[], updates?: Partial<Debt>) => {
    try {
      if (action === 'delete') {
        bulkDeleteDebts(ids);
        if (currentUser) await bulkDeleteDebtsFromFirestore(currentUser.uid, ids);
      } else if (action === 'update' && updates) {
        bulkUpdateDebts(ids, updates);
        if (currentUser) await bulkUpdateDebtsInFirestore(currentUser.uid, ids, updates);
      }
    } catch {
      await loadData();
    }
  };

  return (
    <DataContext.Provider value={{
      debts, incomes, expenses, transactions, loading,
      refreshData: loadData,
      refreshTransactions,
      optimisticDeleteDebts,
      optimisticUpdateDebts,
      syncDebtChanges,
    }}>
      {children}
    </DataContext.Provider>
  );
}
```

**Step 2: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/contexts/DataContext.tsx
git commit -m "feat: add DataContext for centralized state management"
```

---

## Phase 4: Build Pages

### Task 8: Build the Home Page

**Files:**
- Create: `src/pages/HomePage.tsx`

**Step 1: Build HomePage component**

The Home page shows:
1. Hero card with total remaining debt, trend indicator, sparkline
2. Quick action buttons (Log Payment, Add Debt)
3. Cash flow summary (income vs expenses)
4. Debt-free timeline chart (reuse existing DebtChart projection logic)
5. Next payments due list

Key implementation notes:
- Import `useData()` to get debts, incomes, expenses
- Use `formatCurrency` and `formatCurrencyShort` from utils/currency
- Use `calculateTotalDebtProjection` from utils/calculations for the timeline chart
- Use Recharts `AreaChart` for the sparkline and `LineChart` for the projection
- Use Lucide icons: `Plus`, `TrendingDown`, `TrendingUp`, `ArrowRight`
- Use `useNavigate()` to link quick actions to relevant pages
- Use `framer-motion` `motion.div` for card entrance animations
- Style with inline styles using CSS variables (no Ant Design)

The hero card should have a gradient background:
```css
background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);
```

Cash flow card: two columns showing monthly income (green) and monthly expenses (coral), with a net cash flow indicator.

For the debt-free timeline, reuse the existing `calculateTotalDebtProjection` function from `src/utils/calculations.ts`, render with Recharts `AreaChart`.

Next payments due: show debts sorted by their `dateStarted` + months elapsed, display the next payment date and amount. Each item is tappable and navigates to `/debts/:id`.

**Step 2: Register route**

In `src/App.tsx`, replace the placeholder `<div>Home - Coming Soon</div>` with `<HomePage />`.

**Step 3: Verify it renders**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npm start
```

Expected: Home page renders with hero card, cash flow, chart, and next payments.

**Step 4: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/pages/HomePage.tsx src/App.tsx
git commit -m "feat: build Home page with hero card, cash flow, and projections"
```

---

### Task 9: Build the Debts List Page

**Files:**
- Create: `src/pages/DebtsPage.tsx`
- Create: `src/components/DebtCard.tsx` - New custom debt card component

**Step 1: Build DebtCard component**

A clean, custom card for each debt (replaces Ant Design list items):

```
[colored dot] [Debt Name]                    [₸1,200,000]
              [lender / category text]        [₸150,000/mo]
              [============----] 67% paid off
```

- Colored dot: green if paid off, coral if high interest (>15%), blue otherwise
- Progress bar: thin, gradient fill (accent to success)
- Tap navigates to `/debts/:id`
- Uses `motion.div` for hover lift effect
- Right side shows remaining balance (large) and monthly payment (small, muted)

**Step 2: Build DebtsPage**

Layout:
- Header row: "My Debts" title + "Add" button (accent pill)
- Filter pills: All | Active | Paid Off (horizontal row)
- List of DebtCard components
- Empty state with illustration text

The page uses `useData()` for debts. Filter state managed locally.
The "+ Add Debt" button opens the existing DebtForm in a modal (keep the existing modal pattern from App.tsx, or migrate it to this page).

**Step 3: Register route**

Replace the debts placeholder in App.tsx routes.

**Step 4: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/pages/DebtsPage.tsx src/components/DebtCard.tsx src/App.tsx
git commit -m "feat: build Debts list page with custom DebtCard component"
```

---

### Task 10: Build the Debt Detail Page

**Files:**
- Create: `src/pages/DebtDetailPage.tsx`
- Create: `src/components/LogPaymentModal.tsx`

**Step 1: Build LogPaymentModal**

A modal for logging payments against a debt:
- Amount input (pre-filled with debt's monthlyPayment)
- Date input (defaults to today)
- Optional note field
- "Log Payment" submit button

On submit:
1. Create a Transaction object with `uuid()`, debtId, amount, date, type='manual', balanceAfter
2. Call `addTransaction()` from storage.ts
3. Update the debt's `currentAmount` (reduce by payment amount)
4. Call `refreshData()` and `refreshTransactions()` from DataContext
5. Close modal

**Step 2: Build DebtDetailPage**

Uses `useParams()` to get debt ID, finds debt from `useData()`.

Layout:
- Back button (← arrow) + Debt name as header
- Circular progress ring (SVG circle, % paid off)
  - Center: remaining balance
- Three-column stat row: Original Amount | Interest Rate | Monthly Payment
- Mini payoff chart (AreaChart from Recharts, single debt projection)
- "Log Payment" button (primary, full-width)
- Transaction history list (for this debt only, from `transactions.filter(t => t.debtId === id)`)
  - Each entry: date, amount, balance after
  - Empty state if no transactions

The circular progress ring is a simple SVG:
```tsx
<svg width={160} height={160}>
  <circle cx={80} cy={80} r={70} fill="none" stroke="var(--border-subtle)" strokeWidth={8} />
  <circle
    cx={80} cy={80} r={70} fill="none"
    stroke="var(--accent)" strokeWidth={8}
    strokeDasharray={2 * Math.PI * 70}
    strokeDashoffset={2 * Math.PI * 70 * (1 - percentPaid)}
    strokeLinecap="round"
    transform="rotate(-90 80 80)"
  />
</svg>
```

**Step 3: Register route and test navigation**

Replace the debt detail placeholder in App.tsx. Verify that tapping a DebtCard navigates to the detail page.

**Step 4: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/pages/DebtDetailPage.tsx src/components/LogPaymentModal.tsx src/App.tsx
git commit -m "feat: build Debt Detail page with progress ring and payment logging"
```

---

### Task 11: Build the Activity Page

**Files:**
- Create: `src/pages/ActivityPage.tsx`

**Step 1: Build ActivityPage**

Layout:
- Header: "Activity" with filter icon
- Quick filter pills: "This Month" | "Last 30 Days" | "All Time"
- Optional debt filter dropdown (simple select)
- Transaction feed grouped by date

Date grouping logic:
```typescript
const grouped = transactions.reduce((acc, tx) => {
  const dateKey = format(tx.date, 'yyyy-MM-dd');
  if (!acc[dateKey]) acc[dateKey] = [];
  acc[dateKey].push(tx);
  return acc;
}, {} as Record<string, Transaction[]>);
```

Each transaction entry:
- Colored dot matching the debt (look up debt by debtId)
- Debt name
- Amount (coral colored, with minus sign)
- Balance after (muted)
- Tapping navigates to `/debts/:debtId`

Date headers: "Today", "Yesterday", or formatted date (e.g., "Feb 18, 2026").

FAB (floating action button): "+" icon at bottom-right, opens LogPaymentModal with debt selector.

Empty state: "No transactions yet. Log your first payment to start tracking."

**Step 2: Register route**

Replace the activity placeholder in App.tsx.

**Step 3: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/pages/ActivityPage.tsx src/App.tsx
git commit -m "feat: build Activity page with transaction feed and date grouping"
```

---

### Task 12: Build the Settings Page

**Files:**
- Create: `src/pages/SettingsPage.tsx`

**Step 1: Build SettingsPage**

A clean list of settings groups:

```
APPEARANCE
  [Theme]        Dark / Light toggle

LANGUAGE
  [Language]     English / Russian selector

CURRENCY
  [Currency]     ₸ KZT / $ USD / € EUR selector

DATA
  [Export]       Export to CSV / JSON buttons

ACCOUNT
  [User info]    Avatar + name + email
  [Sign Out]     Red sign-out button
```

Implementation notes:
- Theme toggle: reuse the existing theme state (pass `themeMode` and `toggleTheme` through DataContext or a separate ThemeContext, or pass as props through the layout)
- Language: use `i18n.changeLanguage()` from react-i18next
- Currency: store selection in localStorage as `klaro-currency`, create a simple context or use DataContext
- Export: reuse existing `exportToCSV` and `exportToJSON` from utils/export.ts
- Sign out: call `logout()` from AuthContext

Each setting row: label on left, control on right. Simple flexbox rows with padding.

**Step 2: Register route**

Replace the settings placeholder.

**Step 3: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/pages/SettingsPage.tsx src/App.tsx
git commit -m "feat: build Settings page with theme, language, currency, and export"
```

---

## Phase 5: Auto-Logging & Enhanced Debt Form

### Task 13: Add Auto-Log Fields to Debt Form

**Files:**
- Modify: `src/components/DebtForm.tsx`

**Step 1: Add auto-log toggle and fields**

Add to the DebtForm, after the existing fields:

- Toggle: "Auto-log monthly payments" (checkbox/switch)
- When enabled, show:
  - "Payment day" number input (1-28)
  - "Auto-log amount" number input (defaults to monthlyPayment)

These map to the new Debt fields: `autoLog`, `autoLogDay`, `autoLogAmount`.

**Step 2: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/components/DebtForm.tsx
git commit -m "feat: add auto-log payment fields to debt form"
```

---

### Task 14: Implement Auto-Log Check on App Load

**Files:**
- Create: `src/utils/autoLog.ts`
- Modify: `src/contexts/DataContext.tsx` - Call auto-log check after data loads

**Step 1: Create auto-log utility**

```typescript
import { Debt, Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addTransaction } from './storage';
import { updateDebtInFirestore } from './firebaseStorage';
import { updateDebt } from './storage';

export async function processAutoLogPayments(
  debts: Debt[],
  userId?: string
): Promise<{ newTransactions: Transaction[]; updatedDebts: Debt[] }> {
  const today = new Date();
  const newTransactions: Transaction[] = [];
  const updatedDebts: Debt[] = [];

  for (const debt of debts) {
    if (!debt.autoLog || !debt.autoLogDay || debt.currentAmount <= 0) continue;

    const amount = debt.autoLogAmount || debt.monthlyPayment || 0;
    if (amount <= 0) continue;

    // Check if we need to create a transaction for this month
    const lastLog = debt.lastAutoLogDate ? new Date(debt.lastAutoLogDate) : null;
    const paymentDate = new Date(today.getFullYear(), today.getMonth(), debt.autoLogDay);

    // If payment day hasn't passed this month yet, skip
    if (paymentDate > today) continue;

    // If we already logged for this month, skip
    if (lastLog && lastLog.getMonth() === today.getMonth() && lastLog.getFullYear() === today.getFullYear()) continue;

    const balanceAfter = Math.max(0, debt.currentAmount - amount);
    const tx: Transaction = {
      id: uuidv4(),
      debtId: debt.id,
      amount,
      date: paymentDate,
      type: 'recurring',
      balanceAfter,
    };

    await addTransaction(tx, userId);
    newTransactions.push(tx);

    // Update debt
    const updatedDebt = {
      ...debt,
      currentAmount: balanceAfter,
      lastAutoLogDate: paymentDate,
    };
    updateDebt(updatedDebt);
    if (userId) {
      try {
        await updateDebtInFirestore(userId, updatedDebt);
      } catch {}
    }
    updatedDebts.push(updatedDebt);
  }

  return { newTransactions, updatedDebts };
}
```

**Step 2: Call auto-log in DataContext**

In `DataContext.tsx`, after `loadData()` completes in the `init` function, call:

```typescript
import { processAutoLogPayments } from '../utils/autoLog';

// Inside init(), after loadData():
const result = await processAutoLogPayments(debts, currentUser?.uid);
if (result.newTransactions.length > 0) {
  await loadData(); // Refresh to show new transactions
}
```

Note: This needs to run after debts are loaded. Adjust the init sequence so auto-log runs with the loaded debts.

**Step 3: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/utils/autoLog.ts src/contexts/DataContext.tsx
git commit -m "feat: implement recurring payment auto-logging on app load"
```

---

## Phase 6: Login Screen Redesign

### Task 15: Redesign Login Screen

**Files:**
- Modify: `src/components/Login.tsx`

**Step 1: Redesign Login**

Replace the current Login component with:

- Full-screen gradient background: `linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #2563EB 100%)`
- Centered content:
  - "Klaro" wordmark (36px, bold 800, white)
  - Tagline: "Take control of your debt" (16px, text-secondary)
  - Google sign-in button: white background, pill-shaped, Google icon + text
  - Three benefit pills below: "Track Debts" | "See Projections" | "Log Payments"
- Remove Ant Design dependencies from this component
- Use Lucide icons for benefits: `CreditCard`, `TrendingUp`, `Clock`

**Step 2: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/components/Login.tsx
git commit -m "feat: redesign login screen with gradient and bold styling"
```

---

## Phase 7: i18n Updates

### Task 16: Add New Translation Keys

**Files:**
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/ru.ts`

**Step 1: Add new keys for new screens**

Add these keys to both locale files:

```typescript
navigation: {
  // existing keys...
  home: 'Home',           // ru: 'Главная'
  debts: 'Debts',         // ru: 'Долги'
  activity: 'Activity',   // ru: 'Активность'
  settings: 'Settings',   // ru: 'Настройки'
},
home: {
  totalDebt: 'Total Remaining Debt',
  acrossDebts: 'across {{count}} active debts',
  logPayment: 'Log Payment',
  addDebt: 'Add Debt',
  cashFlow: 'Cash Flow',
  monthlyIncome: 'Monthly Income',
  monthlyExpenses: 'Monthly Expenses',
  netCashFlow: 'Net Cash Flow',
  debtFreeTimeline: 'Debt-Free Timeline',
  debtFreeBy: 'Debt-free by {{date}}',
  nextPayments: 'Next Payments Due',
  dueIn: 'Due in {{days}} days',
  noDebts: 'No debts yet. Add your first debt to get started.',
},
activity: {
  title: 'Activity',
  thisMonth: 'This Month',
  last30Days: 'Last 30 Days',
  allTime: 'All Time',
  allDebts: 'All Debts',
  noTransactions: 'No transactions yet. Log your first payment to start tracking.',
  today: 'Today',
  yesterday: 'Yesterday',
},
debtDetail: {
  originalAmount: 'Original',
  interestRate: 'Interest',
  monthlyPayment: 'Monthly',
  payoffProjection: 'Payoff Projection',
  transactionHistory: 'Transaction History',
  logPayment: 'Log Payment',
  markPaid: 'Mark as Paid Off',
  paidOff: 'Paid Off',
  noTransactions: 'No payments logged yet.',
},
logPayment: {
  title: 'Log Payment',
  amount: 'Amount',
  date: 'Date',
  note: 'Note (optional)',
  submit: 'Log Payment',
  selectDebt: 'Select Debt',
},
settings: {
  appearance: 'Appearance',
  theme: 'Theme',
  dark: 'Dark',
  light: 'Light',
  language: 'Language',
  currency: 'Currency',
  data: 'Data',
  exportData: 'Export Data',
  account: 'Account',
  signOut: 'Sign Out',
  about: 'About',
  version: 'Version',
},
autoLog: {
  enable: 'Auto-log monthly payments',
  paymentDay: 'Payment day of month',
  amount: 'Auto-log amount',
},
```

**Step 2: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/i18n/locales/en.ts src/i18n/locales/ru.ts
git commit -m "feat: add i18n keys for new screens (home, activity, settings, etc.)"
```

---

## Phase 8: Cleanup & Polish

### Task 17: Remove Unused Components and Reduce Ant Design

**Files:**
- Delete: `src/components/DebtList.tsx` (old custom table, replaced by DebtCard)
- Delete: `src/components/DebtListAntD.tsx` (replaced by DebtsPage + DebtCard)
- Delete: `src/components/ExpenseList.tsx` (old custom list, budget now on Home)
- Delete: `src/components/ExpenseListAntD.tsx` (replaced by Settings or Home cash flow)
- Delete: `src/components/BulkActionsToolbar.tsx` (replaced by simpler patterns)
- Delete: `src/components/ExportModal.tsx` (export moved to Settings)
- Delete: `src/components/PaidOffBadge.tsx` (replaced by inline badge in DebtCard)
- Delete: `src/components/DrawWaveLoader.tsx` (unused)
- Delete: `src/styles/DrawWaveLoader.css` (unused)

**Step 1: Delete unused files**

Remove files listed above.

**Step 2: Remove unused imports from all remaining files**

Search for any imports of deleted components and remove them.

**Step 3: Verify build**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add -A
git commit -m "chore: remove unused components and reduce Ant Design dependency"
```

---

### Task 18: Clean Up CSS

**Files:**
- Modify: `src/App.css` - Remove styles for deleted components

**Step 1: Remove old styles**

Remove CSS rules for:
- `.nav-tabs` (replaced by BottomNav)
- `.app-header-with-user` (replaced by AppHeader)
- `.debt-table-*` (replaced by DebtCard)
- `.expense-card-*` (replaced by new layouts)
- `.income-section`, `.section-grid` (replaced by new pages)
- Old modal styles (keep modal-overlay and modal-content if still used)
- `.loading-container` and `.loading-text` (replace with skeleton loading)

Keep:
- Theme transition styles
- Any utility classes still in use
- Modal styles if still needed

**Step 2: Verify build**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/App.css
git commit -m "chore: clean up CSS, remove styles for deleted components"
```

---

### Task 19: Add Page Transitions with Framer Motion

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`

**Step 1: Wrap Outlet with AnimatePresence**

```tsx
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// In AppLayout, wrap the Outlet:
const location = useLocation();

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
```

**Step 2: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/components/layout/AppLayout.tsx
git commit -m "feat: add page transitions with Framer Motion"
```

---

### Task 20: Move Income and Expense Management into Settings/Home

**Files:**
- Modify: `src/pages/SettingsPage.tsx` - Add "Manage Income" and "Manage Expenses" sections
- Modify: `src/pages/HomePage.tsx` - Cash flow section links to manage income/expenses

**Step 1: Add income/expense management to Settings**

In SettingsPage, add two new sections:

```
INCOME
  [Manage Income]    → Opens inline form/list for income sources

EXPENSES
  [Manage Expenses]  → Opens inline form/list for recurring expenses
```

Reuse the existing `IncomeForm`, `IncomeList`, `ExpenseForm` components. Render them inline in expandable sections, or as sub-routes (`/settings/income`, `/settings/expenses`).

**Step 2: Link from Home cash flow card**

On the Home page, the cash flow summary card should have a "Manage →" link that navigates to `/settings` (or directly to the income/expense section).

**Step 3: Commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add src/pages/SettingsPage.tsx src/pages/HomePage.tsx
git commit -m "feat: integrate income/expense management into Settings page"
```

---

### Task 21: Final Build & Deploy Test

**Files:** None (verification only)

**Step 1: Full build**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Test locally**

Run:
```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
npx serve -s build -l 3001
```

Test all routes:
- `/` - Home page loads, hero card shows
- `/debts` - Debt list loads
- `/debts/:id` - Debt detail page loads (click a debt)
- `/activity` - Activity page loads
- `/settings` - Settings page loads with all sections
- Bottom nav works on all pages
- Theme toggle works
- Language switch works
- Login/logout works

**Step 3: Deploy**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager"
./deploy-debt-manager.sh
```

**Step 4: Final commit**

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/debt manager/debt-manager"
git add -A
git commit -m "feat: complete full UI/UX redesign of Klaro Debt Manager"
git push origin master
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1. Foundation | 1-3 | New deps, types, design tokens |
| 2. Firebase | 4-5 | Transaction CRUD in Firebase & localStorage |
| 3. Routing | 6-7 | React Router, bottom nav, layout shell, DataContext |
| 4. Pages | 8-12 | Home, Debts, Debt Detail, Activity, Settings |
| 5. Auto-Log | 13-14 | Recurring payment auto-logging |
| 6. Login | 15 | Redesigned login screen |
| 7. i18n | 16 | New translation keys for all screens |
| 8. Cleanup | 17-21 | Remove old code, CSS cleanup, transitions, deploy |

**Total: 21 tasks across 8 phases.**
