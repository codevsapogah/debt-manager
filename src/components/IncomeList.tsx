import React from 'react';
import { useTranslation } from 'react-i18next';
import { IncomeSource } from '../types';
import { deleteIncomeSource, updateIncomeSource } from '../utils/storage';
import { formatCurrency } from '../utils/currency';

interface IncomeListProps {
  incomes: IncomeSource[];
  onIncomeDeleted: () => void;
  onIncomeEdit?: (income: IncomeSource) => void;
}

const IncomeList: React.FC<IncomeListProps> = ({ incomes, onIncomeDeleted, onIncomeEdit }) => {
  const { t } = useTranslation();
  const [processingToggles, setProcessingToggles] = React.useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    if (window.confirm(t('income.deleteConfirm'))) {
      try {
        await deleteIncomeSource(id);
      } catch (error) {
        console.error('Failed to delete income:', error);
      }
      onIncomeDeleted();
    }
  };

  const handleToggleIncludeInTotal = async (income: IncomeSource) => {
    // Prevent multiple rapid clicks
    if (processingToggles.has(income.id)) return;

    // Mark as processing
    setProcessingToggles(prev => new Set(prev).add(income.id));

    const updatedIncome = {
      ...income,
      includeInTotal: income.includeInTotal === false ? true : false
    };

    // Update locally first for immediate feedback
    try {
      await updateIncomeSource(updatedIncome);
    } catch (error) {
      console.error('Failed to update income include flag:', error);
    }
    onIncomeDeleted(); // Refresh UI immediately

    // Clear processing flag after a short delay
    setTimeout(() => {
      setProcessingToggles(prev => {
        const newSet = new Set(prev);
        newSet.delete(income.id);
        return newSet;
      });
    }, 300);

  };

  const convertToMonthly = (income: IncomeSource): number => {
    switch (income.frequency) {
      case 'weekly':
        return income.amount * 4.33; // Average weeks per month
      case 'biweekly':
        return income.amount * 2.17; // Average bi-weeks per month
      case 'yearly':
        return income.amount / 12;
      case 'monthly':
      default:
        return income.amount;
    }
  };

  const getTotalMonthlyIncome = (): number => {
    return incomes
      .filter(income => income.includeInTotal !== false)
      .reduce((total, income) => total + convertToMonthly(income), 0);
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

  if (incomes.length === 0) {
    return (
      <div className="income-list-empty">
        <div className="empty-state">
          <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="empty-text">{t('income.noIncome')}</p>
          <p className="empty-subtext">{t('income.addIncomeHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="income-list">
      <div className="income-list-header">
        <h3>{t('income.sources')}</h3>
        <span className="income-count">{incomes.length} {t('income.sourcesCount')}</span>
      </div>

      <div className="income-items">
        {incomes.map(income => (
          <div key={income.id} className="income-card">
            <div className="income-card-header">
              <div className="income-name-with-toggle">
                <button
                  className={`toggle-dot ${income.includeInTotal !== false ? 'included' : 'excluded'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleIncludeInTotal(income);
                  }}
                  aria-label="Toggle include in total"
                  title={income.includeInTotal !== false ? t('table.excludeTooltip') : t('table.includeTooltip')}
                >
                  <span className="dot"></span>
                </button>
                <h4 className="income-name">{income.name}</h4>
              </div>
              <span className={`frequency-badge ${getFrequencyBadgeClass(income.frequency)}`}>
                {t(`income.frequencies.${income.frequency}`)}
              </span>
            </div>

            <div className="income-card-body">
              <div className="income-amount">
                <span className="amount-label">{t('income.amount')}:</span>
                <span className="amount-value">{formatCurrency(income.amount)}</span>
              </div>

              <div className="income-monthly">
                <span className="monthly-label">{t('income.monthlyEquivalent')}:</span>
                <span className="monthly-value">{formatCurrency(convertToMonthly(income))}</span>
              </div>
            </div>

            <div className="income-card-actions">
              <button
                className="btn-icon btn-edit"
                onClick={() => onIncomeEdit && onIncomeEdit(income)}
                aria-label="Edit income source"
                title={t('common.edit')}
              >
                ✏️
              </button>
              <button
                className="btn-icon btn-delete"
                onClick={() => handleDelete(income.id)}
                aria-label="Delete income source"
                title={t('common.delete')}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="income-summary">
        <div className="summary-card">
          <div className="summary-label">{t('income.totalMonthlyIncome')}</div>
          <div className="summary-value">{formatCurrency(getTotalMonthlyIncome())}</div>
        </div>
      </div>
    </div>
  );
};

export default IncomeList;
