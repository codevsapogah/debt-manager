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
  const [autoLogProcessed, setAutoLogProcessed] = useState(false);

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

  // Process auto-log payments after initial data load
  useEffect(() => {
    if (!loading && !autoLogProcessed && debts.length > 0) {
      setAutoLogProcessed(true);
      const process = async () => {
        try {
          const { processAutoLogPayments } = await import('../utils/autoLog');
          const result = await processAutoLogPayments(debts, currentUser?.uid);
          if (result.newTransactions.length > 0) {
            await loadData();
          }
        } catch (error) {
          console.error('Auto-log processing error:', error);
        }
      };
      process();
    }
  }, [loading, autoLogProcessed, debts, currentUser, loadData]);

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
