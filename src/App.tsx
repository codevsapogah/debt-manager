import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import './App.css';
import './i18n/config';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import DebtForm from './components/DebtForm';
import DebtList from './components/DebtList';
import DebtListAntD from './components/DebtListAntD';
import DebtChart from './components/DebtChart';
import IncomeForm from './components/IncomeForm';
import IncomeList from './components/IncomeList';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import LanguageSwitcher from './components/LanguageSwitcher';
import { loadFromStorage, bulkDeleteDebts, bulkUpdateDebts } from './utils/storage';
import { loadFromFirestore, migrateLocalStorageToFirestore, bulkDeleteDebtsFromFirestore, bulkUpdateDebtsInFirestore } from './utils/firebaseStorage';
import { Debt, IncomeSource, RecurringExpense } from './types';
import GooeyCircleLoader from './components/GooeyCircleLoader';

function AppContent() {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'expenses'>('dashboard');
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showDebtForm, setShowDebtForm] = useState<boolean>(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
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

          const firestoreHasExpenses = data.recurringExpenses && data.recurringExpenses.length > 0;
          const localHasExpenses = localData.recurringExpenses && localData.recurringExpenses.length > 0;

          if (firestoreHasExpenses) {
            setExpenses(data.recurringExpenses || []);
          } else if (localHasExpenses) {
            try {
              const { addExpenseToFirestore } = await import('./utils/firebaseStorage');
              for (const expense of localData.recurringExpenses || []) {
                await addExpenseToFirestore(currentUser.uid, expense);
              }
              console.log('Synced localStorage expenses to Firestore');
            } catch (error) {
              console.error('Failed to sync expenses to Firestore:', error);
            }
          }
        } catch (error) {
          console.error('Error loading from Firestore:', error);
          // Keep localStorage data on error
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      if (currentUser) {
        try {
          // Try to migrate localStorage data to Firestore on first login
          const migrated = await migrateLocalStorageToFirestore(currentUser.uid);
          if (migrated) {
            console.log('Successfully migrated local data to cloud!');
          }
        } catch (error) {
          console.error('Migration error:', error);
        }
      }
      await loadData();
    };

    initializeData();
  }, [currentUser]);

  const handleDataUpdate = () => {
    loadData();
  };

  // Optimistic update handlers
  const handleOptimisticDebtDelete = (ids: string[]) => {
    setDebts(prev => prev.filter(debt => !ids.includes(debt.id)));
  };

  const handleOptimisticDebtUpdate = (ids: string[], updates: Partial<Debt>) => {
    setDebts(prev => prev.map(debt =>
      ids.includes(debt.id) ? { ...debt, ...updates } : debt
    ));
  };

  // Async sync to storage/firebase in background
  const syncDebtChanges = async (action: 'delete' | 'update', ids: string[], updates?: Partial<Debt>) => {
    try {
      if (action === 'delete') {
        bulkDeleteDebts(ids);
        if (currentUser) {
          await bulkDeleteDebtsFromFirestore(currentUser.uid, ids);
        }
      } else if (action === 'update' && updates) {
        bulkUpdateDebts(ids, updates);
        if (currentUser) {
          await bulkUpdateDebtsInFirestore(currentUser.uid, ids, updates);
        }
      }
    } catch (error) {
      console.error('Failed to sync changes:', error);
      // On error, reload from source of truth
      loadData();
    }
  };

  const handleDebtEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setShowDebtForm(true);
  };

  const handleEditComplete = () => {
    setEditingDebt(null);
    setShowDebtForm(false);
    loadData();
  };

  const handleAddDebt = () => {
    setEditingDebt(null);
    setShowDebtForm(true);
  };

  const handleFormClose = () => {
    setEditingDebt(null);
    setShowDebtForm(false);
  };

  const handleIncomeEdit = (income: IncomeSource) => {
    setEditingIncome(income);
  };

  const handleIncomeEditComplete = () => {
    setEditingIncome(null);
    loadData();
  };

  const handleExpenseEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
  };

  const handleExpenseEditComplete = () => {
    setEditingExpense(null);
    loadData();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Show login screen if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  // Show loading while data is being loaded
  if (loading) {
    const loaderProps = {
      loading: true,
      size: 100,
      duration: 1.5,
      colors: ['#5e72e4', '#825ee4', '#5e72e4']
    };

    return (
      <div className="app">
        <div className="loading-container">
          <GooeyCircleLoader {...loaderProps} />
          <div className="loading-text" style={{ marginTop: '20px' }}>
            {t('chart.loadingData')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-with-user">
          <div></div>
          <div>
            <h1>{t('app.title')}</h1>
            <nav className="nav-tabs">
              <button
                className={activeTab === 'dashboard' ? 'active' : ''}
                onClick={() => setActiveTab('dashboard')}
              >
                {t('navigation.dashboard')}
              </button>
              <button
                className={activeTab === 'income' ? 'active' : ''}
                onClick={() => setActiveTab('income')}
              >
                {t('navigation.manageIncome')}
              </button>
              <button
                className={activeTab === 'expenses' ? 'active' : ''}
                onClick={() => setActiveTab('expenses')}
              >
                {t('navigation.manageExpenses')}
              </button>
            </nav>
          </div>
          
          <div className="user-info">
            <LanguageSwitcher />
            {currentUser.photoURL && (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="user-avatar"
              />
            )}
            <span className="user-name">
              {currentUser.displayName || currentUser.email}
            </span>
            <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              {t('auth.signOut')}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <DebtChart debts={debts} incomes={incomes} expenses={expenses} />
            <div className="dashboard-overview">
              <DebtListAntD
                debts={debts}
                onOptimisticDelete={handleOptimisticDebtDelete}
                onOptimisticUpdate={handleOptimisticDebtUpdate}
                onSync={syncDebtChanges}
                onDebtEdit={handleDebtEdit}
              />
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="income-section">
            <div className="section-grid">
              <div className="form-section">
                <IncomeForm
                  onIncomeAdded={handleDataUpdate}
                  editingIncome={editingIncome}
                  onEditComplete={handleIncomeEditComplete}
                />
              </div>
              <div className="list-section">
                <IncomeList
                  incomes={incomes}
                  onIncomeDeleted={handleDataUpdate}
                  onIncomeEdit={handleIncomeEdit}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="expenses-unified-section">
            <div className="expenses-header">
              <button className="add-expense-btn" onClick={handleAddDebt}>
                + {t('debt.addNewDebt')}
              </button>
              <button className="add-expense-btn" onClick={() => setEditingExpense({} as RecurringExpense)}>
                + {t('expense.addExpense')}
              </button>
            </div>

            <div className="expenses-content">
              <div className="loans-section">
                <h3>{t('debt.debts')}</h3>
                <DebtListAntD
                  debts={debts}
                  onOptimisticDelete={handleOptimisticDebtDelete}
                  onOptimisticUpdate={handleOptimisticDebtUpdate}
                  onSync={syncDebtChanges}
                  onDebtEdit={handleDebtEdit}
                />
              </div>

              <div className="recurring-expenses-section">
                <h3>{t('expense.expenses')}</h3>
                <ExpenseList
                  expenses={expenses}
                  onExpenseDeleted={handleDataUpdate}
                  onExpenseEdit={handleExpenseEdit}
                />
              </div>
            </div>

            {/* Expense Form Modal */}
            {editingExpense && (
              <div className="modal-overlay" onClick={handleExpenseEditComplete}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{editingExpense.id ? t('expense.editExpense') : t('expense.addExpense')}</h2>
                    <button className="modal-close" onClick={handleExpenseEditComplete}>{t('common.close')}</button>
                  </div>
                  <div className="modal-body">
                    <ExpenseForm
                      onExpenseAdded={() => {
                        handleDataUpdate();
                        handleExpenseEditComplete();
                      }}
                      editingExpense={editingExpense.id ? editingExpense : null}
                      onEditComplete={handleExpenseEditComplete}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Debt Form Modal */}
      {showDebtForm && (
        <div className="modal-overlay" onClick={handleFormClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDebt ? t('debt.editDebt') : t('debt.addDebt')}</h2>
              <button className="modal-close" onClick={handleFormClose}>{t('common.close')}</button>
            </div>
            <div className="modal-body">
              <DebtForm 
                onDebtAdded={() => {
                  handleDataUpdate();
                  handleFormClose();
                }} 
                editingDebt={editingDebt}
                onEditComplete={handleEditComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4f46e5',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          borderRadius: 12,
          fontSize: 14,
        },
        components: {
          Table: {
            borderRadius: 16,
            headerBg: '#f9fafb',
          },
          Button: {
            borderRadius: 10,
            controlHeight: 40,
          },
          Modal: {
            borderRadius: 16,
          },
        },
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
