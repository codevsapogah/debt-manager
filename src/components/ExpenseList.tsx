import React from 'react';
import { useTranslation } from 'react-i18next';
import { RecurringExpense } from '../types';
import { deleteRecurringExpense, updateRecurringExpense } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';

interface ExpenseListProps {
  expenses: RecurringExpense[];
  onExpenseDeleted: () => void;
  onExpenseEdit?: (expense: RecurringExpense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onExpenseDeleted, onExpenseEdit }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [processingToggles, setProcessingToggles] = React.useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    if (window.confirm(t('expense.deleteConfirm'))) {
      await deleteRecurringExpense(id);
      onExpenseDeleted();
    }
  };

  const handleToggleIncludeInTotal = async (expense: RecurringExpense) => {
    // Prevent multiple rapid clicks
    if (processingToggles.has(expense.id)) return;

    // Mark as processing
    setProcessingToggles(prev => new Set(prev).add(expense.id));

    const updatedExpense = {
      ...expense,
      includeInTotal: expense.includeInTotal === false ? true : false
    };

    // Update locally first for immediate feedback
    await updateRecurringExpense(updatedExpense);
    onExpenseDeleted(); // Refresh UI immediately

    // Clear processing flag after a short delay
    setTimeout(() => {
      setProcessingToggles(prev => {
        const newSet = new Set(prev);
        newSet.delete(expense.id);
        return newSet;
      });
    }, 300);
  };

  const convertToMonthly = (expense: RecurringExpense): number => {
    switch (expense.frequency) {
      case 'weekly':
        return expense.amount * 4.33; // Average weeks per month
      case 'biweekly':
        return expense.amount * 2.17; // Average bi-weeks per month
      case 'yearly':
        return expense.amount / 12;
      case 'monthly':
      default:
        return expense.amount;
    }
  };

  const getTotalMonthlyExpenses = (): number => {
    return expenses
      .filter(expense => expense.includeInTotal !== false)
      .reduce((total, expense) => total + convertToMonthly(expense), 0);
  };

  const getFrequencyBadgeClass = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'badge-weekly';
      case 'biweekly': return 'badge-biweekly';
      case 'monthly': return 'badge-monthly';
      case 'yearly': return 'badge-yearly';
      default: return '';
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="expense-list-empty">
        <div className="empty-state">
          <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 14l6-6m0 0l6 6m-6-6v12M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="empty-text">{t('expense.noExpenses')}</p>
          <p className="empty-subtext">{t('expense.addExpenseHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-list">
      <div className="expense-list-header">
        <h3>{t('expense.expenses')}</h3>
        <span className="expense-count">{expenses.length} {t('expense.expensesCount')}</span>
      </div>

      <div className="expense-items">
        {expenses.map(expense => (
          <div key={expense.id} className="expense-card">
            <div className="expense-card-header">
              <div className="expense-name-with-toggle">
                <button
                  className={`toggle-dot ${expense.includeInTotal !== false ? 'included' : 'excluded'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleIncludeInTotal(expense);
                  }}
                  aria-label="Toggle include in total"
                  title={expense.includeInTotal !== false ? t('table.excludeTooltip') : t('table.includeTooltip')}
                >
                  <span className="dot"></span>
                </button>
                <h4 className="expense-name">{expense.name}</h4>
              </div>
              <div className="expense-badges">
                {expense.category && (
                  <span className="category-badge">{expense.category}</span>
                )}
                <span className={`frequency-badge ${getFrequencyBadgeClass(expense.frequency)}`}>
                  {t(`expense.frequencies.${expense.frequency}`)}
                </span>
              </div>
            </div>

            <div className="expense-card-body">
              <div className="expense-amount">
                <span className="amount-label">{t('expense.amount')}:</span>
                <span className="amount-value">{formatCurrency(expense.amount)}</span>
              </div>

              <div className="expense-monthly">
                <span className="monthly-label">{t('expense.monthlyEquivalent')}:</span>
                <span className="monthly-value">{formatCurrency(convertToMonthly(expense))}</span>
              </div>
            </div>

            <div className="expense-card-actions">
              <button
                className="btn-icon btn-edit"
                onClick={() => onExpenseEdit && onExpenseEdit(expense)}
                aria-label="Edit expense"
                title={t('common.edit')}
              >
                ✏️
              </button>
              <button
                className="btn-icon btn-delete"
                onClick={() => handleDelete(expense.id)}
                aria-label="Delete expense"
                title={t('common.delete')}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="expense-summary">
        <div className="summary-card expense-summary-card">
          <div className="summary-label">{t('expense.totalMonthlyExpenses')}</div>
          <div className="summary-value">-{formatCurrency(getTotalMonthlyExpenses())}</div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseList;