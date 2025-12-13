import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Debt } from '../types';
import { deleteDebt, updateDebt, addDebt } from '../utils/storage';
import { calculateDebtProjection, calculateCurrentBalance } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';

interface DebtListProps {
  debts: Debt[];
  onDebtDeleted: () => void;
  onDebtEdit: (debt: Debt) => void;
}

type SortField = 'name' | 'currentAmount' | 'totalAmount' | 'interestRate' | 'monthlyPayment' | 'monthsLeft' | 'payoffDate' | 'progress';
type SortDirection = 'asc' | 'desc';

const DebtList: React.FC<DebtListProps> = ({ debts, onDebtDeleted, onDebtEdit }) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [processingToggles, setProcessingToggles] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string, debtName: string) => {
    if (window.confirm(t('debt.deleteConfirm', { name: debtName }))) {
      try {
        await deleteDebt(id);
      } catch (error) {
        console.error('Failed to delete debt:', error);
      }
      onDebtDeleted();
    }
  };

  const handleEdit = (id: string) => {
    const debt = debts.find(d => d.id === id);
    if (debt) {
      onDebtEdit(debt);
    }
  };

  const handleToggleIncludeInTotal = async (id: string) => {
    // Prevent multiple rapid clicks
    if (processingToggles.has(id)) return;

    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    // Mark as processing
    setProcessingToggles(prev => new Set(prev).add(id));

    const updatedDebt = {
      ...debt,
      includeInTotal: debt.includeInTotal === false ? true : false
    };

    // Update locally first for immediate feedback
    try {
      await updateDebt(id, updatedDebt);
    } catch (error) {
      console.error('Failed to update debt include flag:', error);
    }
    onDebtDeleted(); // Refresh UI immediately

    // Clear processing flag after a short delay
    setTimeout(() => {
      setProcessingToggles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);

  };

  const handleDuplicate = async (id: string) => {
    const debt = debts.find(d => d.id === id);
    if (debt) {
      const duplicatedDebt: Debt = {
        ...debt,
        id: uuidv4(),
        name: `${debt.name} ${t('debt.copy')}`,
        currentAmount: debt.totalAmount, // Reset current to total for the copy
      };
      try {
        await addDebt(duplicatedDebt);
      } catch (error) {
        console.error('Failed to duplicate debt:', error);
      }
      onDebtDeleted(); // Refresh the data
    }
  };

  const handleSort = (field: SortField) => {
    console.log(`CLICKED HEADER: ${field}`);
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortDebts = (debts: Debt[]): Debt[] => {
    return [...debts].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortField === 'currentAmount') {
        aValue = calculateCurrentBalance(a).currentBalance;
        bValue = calculateCurrentBalance(b).currentBalance;
      } else if (sortField === 'totalAmount') {
        aValue = a.totalAmount;
        bValue = b.totalAmount;
      } else if (sortField === 'interestRate') {
        aValue = a.interestRate;
        bValue = b.interestRate;
      } else if (sortField === 'monthlyPayment') {
        aValue = a.monthlyPayment || 0;
        bValue = b.monthlyPayment || 0;
      } else if (sortField === 'monthsLeft') {
        const aProjForMonths = calculateDebtProjection(a);
        const bProjForMonths = calculateDebtProjection(b);
        const aBalForMonths = a.currentAmount !== a.totalAmount ? a.currentAmount : calculateCurrentBalance(a).currentBalance;
        const bBalForMonths = b.currentAmount !== b.totalAmount ? b.currentAmount : calculateCurrentBalance(b).currentBalance;
        aValue = aBalForMonths <= 0 ? 0 : aProjForMonths.length;
        bValue = bBalForMonths <= 0 ? 0 : bProjForMonths.length;
      } else if (sortField === 'payoffDate') {
        const aProjForDate = calculateDebtProjection(a);
        const bProjForDate = calculateDebtProjection(b);
        aValue = aProjForDate.length > 0 ? aProjForDate[aProjForDate.length - 1].date.getTime() : new Date(2099, 11, 31).getTime();
        bValue = bProjForDate.length > 0 ? bProjForDate[bProjForDate.length - 1].date.getTime() : new Date(2099, 11, 31).getTime();
      } else if (sortField === 'progress') {
        const aBalForProgress = calculateCurrentBalance(a).currentBalance;
        const bBalForProgress = calculateCurrentBalance(b).currentBalance;
        aValue = a.totalAmount > 0 ? ((a.totalAmount - aBalForProgress) / a.totalAmount) * 100 : 0;
        bValue = b.totalAmount > 0 ? ((b.totalAmount - bBalForProgress) / b.totalAmount) * 100 : 0;
      } else {
        return 0;
      }

      if (typeof aValue === 'string') {
        // Natural sorting for strings with numbers
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' })
          : bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  };

  const getPayoffDate = (debt: Debt): string => {
    const projection = calculateDebtProjection(debt);
    if (projection.length === 0) return t('overview.unknown');
    const lastPoint = projection[projection.length - 1];
    return format(lastPoint.date, 'MMM yyyy');
  };

  if (debts.length === 0) {
    return <p className="no-data">{t('debt.noDebts')}</p>;
  }

  const includedDebts = debts.filter(debt => debt.includeInTotal !== false);
  const totalOriginalDebt = includedDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
  const totalCurrentDebt = includedDebts.reduce((sum, debt) => {
    const { currentBalance } = calculateCurrentBalance(debt);
    // Use manual override if available, otherwise calculated balance
    const actualBalance = debt.currentAmount !== debt.totalAmount 
      ? debt.currentAmount 
      : currentBalance;
    return sum + actualBalance;
  }, 0);
  const totalPaidOff = totalOriginalDebt - totalCurrentDebt;
  const totalProgressPercent = totalOriginalDebt > 0 ? (totalPaidOff / totalOriginalDebt) * 100 : 0;
  const totalPayments = includedDebts.reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0);

  return (
    <div className="debt-list">
      <div className="debt-summary">
        <h3>{t('overview.debtOverview')}</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">{t('overview.currentDebt')}</span>
            <span className="stat-value">{formatCurrency(totalCurrentDebt)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('overview.totalPaidOff')}</span>
            <span className="stat-value positive">{formatCurrency(totalPaidOff)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{t('overview.monthlyPayments')}</span>
            <span className="stat-value">{formatCurrency(totalPayments)}</span>
          </div>
        </div>

        <div className="total-progress-section">
          <div className="total-progress-header">
            <span className="progress-label">{t('overview.overallProgress')}</span>
            <span className="progress-percentage">{t('overview.paidOff', { percent: totalProgressPercent.toFixed(1) })}</span>
          </div>
          <div className="total-progress-bar">
            <div className="total-progress-track">
              <div 
                className="total-progress-fill"
                style={{ width: `${Math.min(100, totalProgressPercent)}%` }}
              ></div>
            </div>
          </div>
          <div className="progress-amounts">
            <span className="original-amount">{t('overview.started', { amount: formatCurrency(totalOriginalDebt) })}</span>
            <span className="remaining-amount">{t('overview.remaining', { amount: formatCurrency(totalCurrentDebt) })}</span>
          </div>
        </div>
      </div>

      <div className="debt-table">
        <div className="debt-table-header">
          <div className="col-name sortable" onClick={() => handleSort('name')}>
            {t('table.name')} {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-current sortable" onClick={() => handleSort('currentAmount')}>
            {t('table.current')} {sortField === 'currentAmount' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-total sortable" onClick={() => handleSort('totalAmount')}>
            {t('table.total')} {sortField === 'totalAmount' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-rate sortable" onClick={() => handleSort('interestRate')}>
            {t('table.rate')} {sortField === 'interestRate' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-payment sortable" onClick={() => handleSort('monthlyPayment')}>
            {t('table.payment')} {sortField === 'monthlyPayment' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-months sortable" onClick={() => handleSort('monthsLeft')}>
            {t('table.monthsLeft')} {sortField === 'monthsLeft' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-payoff sortable" onClick={() => handleSort('payoffDate')}>
            {t('table.payoffDate')} {sortField === 'payoffDate' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-progress sortable" onClick={() => handleSort('progress')}>
            {t('table.progress')} {sortField === 'progress' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="col-included">{t('table.inTotal')}</div>
          <div className="col-actions">{t('table.actions')}</div>
        </div>
        
        {sortDebts(debts).map(debt => {
          // Calculate actual current balance based on payments made since start date
          const balanceInfo = calculateCurrentBalance(debt);
          // Use manual override if debt.currentAmount was manually set (different from totalAmount)
          const actualCurrentBalance = debt.currentAmount !== debt.totalAmount 
            ? debt.currentAmount 
            : balanceInfo.currentBalance;
          
          const projection = calculateDebtProjection(debt);
          const monthsLeft = actualCurrentBalance <= 0 ? 0 : projection.length;
          const progressPercent = debt.totalAmount > 0 ? ((debt.totalAmount - actualCurrentBalance) / debt.totalAmount) * 100 : 0;
          
          // Check if payment is too low to cover interest
          // Treat 1.2% as 0% interest (0-0-12 installment loans)
          const adjustedInterestRate = debt.interestRate === 1.2 ? 0 : debt.interestRate;
          const monthlyInterest = actualCurrentBalance * (adjustedInterestRate / 100 / 12);
          const paymentTooLow = debt.monthlyPayment && debt.monthlyPayment <= monthlyInterest;
          
          const isNearPayoff = monthsLeft > 0 && monthsLeft <= 6;
          const isHighInterest = debt.interestRate > 30;
          
          return (
            <div 
              key={debt.id} 
              className={`debt-table-row ${isNearPayoff ? 'near-payoff' : ''} ${isHighInterest ? 'high-interest' : ''} ${debt.includeInTotal === false ? 'excluded-from-total' : ''}`}
            >
              <div className="col-name">
                <strong>{debt.name}</strong>
              </div>
              
              <div className="col-current">
                {formatCurrency(actualCurrentBalance)}
              </div>
              
              <div className="col-total">
                {formatCurrency(debt.totalAmount)}
              </div>
              
              <div className="col-rate">
                {debt.interestRate.toFixed(1)}%
              </div>
              
              <div className="col-payment">
                {debt.monthlyPayment ? formatCurrency(debt.monthlyPayment) : '-'}
              </div>
              
              <div className="col-months">
                <span className={`months-badge ${paymentTooLow ? 'payment-too-low' : ''}`}>
                  {actualCurrentBalance <= 0 ? t('overview.paid') : 
                   paymentTooLow ? t('overview.never') : 
                   (monthsLeft > 0 ? monthsLeft : '-')}
                </span>
              </div>
              
              <div className="col-payoff">
                {actualCurrentBalance <= 0 ? t('overview.paid') : (debt.monthlyPayment ? getPayoffDate(debt) : '-')}
              </div>
              
              <div className="col-progress">
                <div className="mini-progress">
                  <div 
                    className="mini-progress-fill"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  ></div>
                </div>
                <span className="progress-percent">{progressPercent.toFixed(0)}%</span>
              </div>
              
              <div className="col-included">
                <button
                  className={`toggle-dot ${debt.includeInTotal !== false ? 'included' : 'excluded'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleIncludeInTotal(debt.id);
                  }}
                  title={debt.includeInTotal !== false ? t('table.excludeTooltip') : t('table.includeTooltip')}
                >
                  <span className="dot"></span>
                </button>
              </div>
              
              <div className="col-actions">
                <div className="actions-vertical">
                  <button 
                    className="mini-btn edit-mini-btn" 
                    onClick={() => handleEdit(debt.id)}
                    title="Edit debt"
                  >
                    📝
                  </button>
                  <button 
                    className="mini-btn duplicate-mini-btn" 
                    onClick={() => handleDuplicate(debt.id)}
                    title="Duplicate debt"
                  >
                    📋
                  </button>
                  <button 
                    className="mini-btn delete-mini-btn" 
                    onClick={() => handleDelete(debt.id, debt.name)}
                    title="Delete debt"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DebtList;
