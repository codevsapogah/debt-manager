import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Debt, Transaction } from '../types';
import { addTransaction, updateDebt } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

interface LogPaymentModalProps {
  debt: Debt;
  isOpen: boolean;
  onClose: () => void;
  onPaymentLogged: () => void;
}

const LogPaymentModal: React.FC<LogPaymentModalProps> = ({ debt, isOpen, onClose, onPaymentLogged }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { refreshData, refreshTransactions } = useData();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [amount, setAmount] = useState<number>(debt.monthlyPayment || 0);
  const [dateStr, setDateStr] = useState<string>(todayStr);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-family)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || amount <= 0) return;
    setSubmitting(true);

    try {
      const balanceAfter = Math.max(0, debt.currentAmount - amount);
      const transaction: Transaction = {
        id: uuidv4(),
        debtId: debt.id,
        amount,
        date: new Date(dateStr),
        type: 'manual',
        note: note || undefined,
        balanceAfter,
      };
      await addTransaction(transaction, currentUser?.uid);

      // Update debt balance
      const updatedDebt: Debt = { ...debt, currentAmount: balanceAfter };
      await updateDebt(debt.id, updatedDebt);
      if (currentUser) {
        const { updateDebtInFirestore } = await import('../utils/firebaseStorage');
        await updateDebtInFirestore(currentUser.uid, updatedDebt);
      }

      // Refresh data
      await refreshData();
      await refreshTransactions(debt.id);
      onPaymentLogged();
    } catch (error) {
      console.error('Error logging payment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 24,
          maxWidth: 400,
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('logPayment.title')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: 22,
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            {t('common.close')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Amount */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              {t('logPayment.amount')}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
              step="any"
              style={inputStyle}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              {t('logPayment.date')}
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {/* Note */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              {t('logPayment.note')}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--accent)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: 15,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              fontFamily: 'var(--font-family)',
            }}
          >
            {t('logPayment.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogPaymentModal;
