import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/currency';
import { format, isToday, isYesterday, startOfMonth, subDays } from 'date-fns';
import { Clock, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Transaction, Debt } from '../types';
import LogPaymentModal from '../components/LogPaymentModal';

type TimeFilter = 'thisMonth' | 'last30' | 'allTime';

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = format(d, 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatDateHeader(dateStr: string, t: (key: string) => string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return t('activity.today');
  if (isYesterday(d)) return t('activity.yesterday');
  return format(d, 'MMM d, yyyy');
}

function getDebtDotColor(debt: Debt | undefined): string {
  if (!debt) return 'var(--accent)';
  if (debt.currentAmount <= 0) return 'var(--success)';
  if (debt.interestRate > 15) return 'var(--coral)';
  return 'var(--accent)';
}

const ActivityPage: React.FC = () => {
  const { debts, transactions, refreshData, refreshTransactions } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('allTime');
  const [debtFilter, setDebtFilter] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<Debt | null>(null);
  const [showDebtPicker, setShowDebtPicker] = useState(false);

  const debtMap = useMemo(() => {
    const map: Record<string, Debt> = {};
    for (const d of debts) {
      map[d.id] = d;
    }
    return map;
  }, [debts]);

  const activeDebts = useMemo(
    () => debts.filter(d => d.currentAmount > 0),
    [debts]
  );

  const filtered = useMemo(() => {
    let result = [...transactions];

    // Time filter
    if (timeFilter === 'thisMonth') {
      const start = startOfMonth(new Date());
      result = result.filter(tx => new Date(tx.date) >= start);
    } else if (timeFilter === 'last30') {
      const start = subDays(new Date(), 30);
      result = result.filter(tx => new Date(tx.date) >= start);
    }

    // Debt filter
    if (debtFilter !== 'all') {
      result = result.filter(tx => tx.debtId === debtFilter);
    }

    return result;
  }, [transactions, timeFilter, debtFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  // Debt filter pills: show up to 3 debts
  const debtFilterOptions = useMemo(() => {
    return debts.slice(0, 3);
  }, [debts]);

  const timeFilters: { key: TimeFilter; labelKey: string }[] = [
    { key: 'thisMonth', labelKey: 'activity.thisMonth' },
    { key: 'last30', labelKey: 'activity.last30Days' },
    { key: 'allTime', labelKey: 'activity.allTime' },
  ];

  const handleFabClick = () => {
    if (activeDebts.length === 0) return;
    if (activeDebts.length === 1) {
      setSelectedDebtForPayment(activeDebts[0]);
      setShowPaymentModal(true);
    } else {
      setShowDebtPicker(true);
    }
  };

  const handlePaymentLogged = async () => {
    setShowPaymentModal(false);
    setSelectedDebtForPayment(null);
    await refreshData();
    await refreshTransactions();
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: 'calc(100vh - 140px)',
      }}
    >
      {/* 1. Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {t('activity.title')}
        </h1>
      </div>

      {/* 2. Time Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px',
        }}
      >
        {timeFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setTimeFilter(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: timeFilter === f.key
                ? '1.5px solid var(--accent)'
                : '1.5px solid var(--border-default)',
              background: timeFilter === f.key ? 'var(--accent)' : 'transparent',
              color: timeFilter === f.key ? '#FFFFFF' : 'var(--text-tertiary)',
              fontFamily: 'var(--font-family)',
              whiteSpace: 'nowrap',
            }}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* 3. Debt Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px 0',
          marginBottom: 16,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => setDebtFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
            border: 'none',
            background: debtFilter === 'all' ? 'var(--accent-subtle)' : 'transparent',
            color: debtFilter === 'all' ? 'var(--accent)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-family)',
            whiteSpace: 'nowrap',
          }}
        >
          {t('activity.allDebts')}
        </button>
        {debtFilterOptions.map(d => (
          <button
            key={d.id}
            onClick={() => setDebtFilter(d.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: 'none',
              background: debtFilter === d.id ? 'var(--accent-subtle)' : 'transparent',
              color: debtFilter === d.id ? 'var(--accent)' : 'var(--text-tertiary)',
              fontFamily: 'var(--font-family)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 120,
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* 4. Transaction Feed or Empty State */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            textAlign: 'center',
            paddingTop: 80,
            paddingBottom: 80,
          }}
        >
          <Clock size={48} style={{ color: 'var(--text-tertiary)' }} />
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
              padding: '0 32px',
            }}
          >
            {t('activity.noTransactions')}
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {grouped.map(([dateStr, txs], groupIndex) => (
            <div key={dateStr}>
              {/* Date header */}
              <p
                style={{
                  margin: 0,
                  padding: '16px 16px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {formatDateHeader(dateStr, t)}
              </p>

              {/* Transaction entries */}
              {txs.map((tx, txIndex) => {
                const debt = debtMap[tx.debtId];
                const dotColor = getDebtDotColor(debt);

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: (groupIndex * txs.length + txIndex) * 0.03,
                    }}
                    onClick={() => navigate(`/debts/${tx.debtId}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      margin: '0 16px 8px',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      gap: 12,
                    }}
                    onHoverStart={() => {}}
                    whileHover={{
                      backgroundColor: 'var(--bg-surface-hover)',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Left: colored dot */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        flexShrink: 0,
                      }}
                    />

                    {/* Middle: debt name, note, recurring badge */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {debt?.name || 'Unknown Debt'}
                        </p>
                        {tx.type === 'recurring' && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--accent-subtle)',
                              color: 'var(--accent)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            recurring
                          </span>
                        )}
                      </div>
                      {tx.note && (
                        <p
                          style={{
                            margin: '2px 0 0',
                            fontSize: 12,
                            color: 'var(--text-tertiary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {tx.note}
                        </p>
                      )}
                    </div>

                    {/* Right: amount and balance after */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--coral)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        -{formatCurrency(tx.amount)}
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 12,
                          color: 'var(--text-tertiary)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {formatCurrency(tx.balanceAfter)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      {activeDebts.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
          onClick={handleFabClick}
          style={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 40,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={24} />
        </motion.button>
      )}

      {/* Debt Picker Modal */}
      {showDebtPicker && (
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
          onClick={() => setShowDebtPicker(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 24,
              maxWidth: 400,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {t('logPayment.selectDebt')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeDebts.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDebtForPayment(d);
                    setShowDebtPicker(false);
                    setShowPaymentModal(true);
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-card)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: 'var(--font-family)',
                    transition: 'background-color 0.15s',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-card)';
                  }}
                >
                  <span>{d.name}</span>
                  <span
                    style={{
                      color: 'var(--text-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatCurrency(d.currentAmount)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {showPaymentModal && selectedDebtForPayment && (
        <LogPaymentModal
          debt={selectedDebtForPayment}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedDebtForPayment(null);
          }}
          onPaymentLogged={handlePaymentLogged}
        />
      )}
    </div>
  );
};

export default ActivityPage;
