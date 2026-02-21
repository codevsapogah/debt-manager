import React from 'react';
import { Debt } from '../types';
import { formatCurrency, formatCurrencyShort } from '../utils/currency';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface DebtCardProps {
  debt: Debt;
  onClick: () => void;
}

const DebtCard: React.FC<DebtCardProps> = ({ debt, onClick }) => {
  const { t } = useTranslation();

  const isPaidOff = debt.currentAmount <= 0;
  const isHighInterest = debt.interestRate > 15;
  const dotColor = isPaidOff
    ? 'var(--success)'
    : isHighInterest
      ? 'var(--coral)'
      : 'var(--accent)';

  const paidOff = debt.totalAmount - debt.currentAmount;
  const progressPercent = debt.totalAmount > 0
    ? Math.min(100, Math.max(0, Math.round((paidOff / debt.totalAmount) * 100)))
    : 0;

  const startedDate = debt.dateStarted instanceof Date
    ? debt.dateStarted
    : new Date(debt.dateStarted);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        cursor: 'pointer',
        opacity: isPaidOff ? 0.6 : 1,
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Top row: dot + name + amounts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left: dot + name + started date */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: dotColor,
              flexShrink: 0,
              marginTop: 5,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {debt.name}
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12,
                color: 'var(--text-tertiary)',
              }}
            >
              Started: {format(startedDate, 'MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Right: remaining balance + monthly payment */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(Math.round(debt.currentAmount))}
          </p>
          {debt.monthlyPayment && debt.monthlyPayment > 0 && (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12,
                color: 'var(--text-tertiary)',
              }}
            >
              {formatCurrencyShort(debt.monthlyPayment)}{t('debtsPage.perMonth')}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 4,
            borderRadius: 9999,
            backgroundColor: 'var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              borderRadius: 9999,
              background: 'linear-gradient(90deg, var(--accent), var(--success))',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {progressPercent}%
        </span>
      </div>
    </motion.div>
  );
};

export default DebtCard;
