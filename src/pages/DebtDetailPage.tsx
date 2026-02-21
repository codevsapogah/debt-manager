import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatCurrencyShort } from '../utils/currency';
import { calculateDebtProjection, calculateCurrentBalance } from '../utils/calculations';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import LogPaymentModal from '../components/LogPaymentModal';

const DebtDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { debts, transactions, loading } = useData();

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const debt = useMemo(() => debts.find((d) => d.id === id), [debts, id]);

  const debtTransactions = useMemo(() => {
    if (!id) return [];
    return transactions
      .filter((tx) => tx.debtId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, id]);

  const projection = useMemo(() => {
    if (!debt) return [];
    return calculateDebtProjection(debt);
  }, [debt]);

  const chartData = useMemo(() => {
    if (projection.length === 0) return [];
    const step = Math.max(1, Math.floor(projection.length / 12));
    const sampled = projection.filter((_, i) => i % step === 0 || i === projection.length - 1);
    return sampled.map((p) => ({
      month: format(p.date, 'MMM yy'),
      remaining: Math.round(p.remainingDebt),
    }));
  }, [projection]);

  const { currentBalance: calculatedBalance } = useMemo(
    () => debt ? calculateCurrentBalance(debt) : { currentBalance: 0, totalPaid: 0, interestPaid: 0, monthsElapsed: 0 },
    [debt]
  );
  const displayBalance = debt && debt.currentAmount !== debt.totalAmount
    ? debt.currentAmount
    : calculatedBalance;

  const percentPaid = debt && debt.totalAmount > 0
    ? Math.min(1, Math.max(0, (debt.totalAmount - displayBalance) / debt.totalAmount))
    : 0;
  const circumference = 2 * Math.PI * 70;

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--text-secondary)',
        }}
      >
        {t('common.loading')}
      </div>
    );
  }

  // Not found state
  if (!debt) {
    return (
      <div
        style={{
          padding: 16,
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Debt not found</p>
        <button
          onClick={() => navigate('/debts')}
          style={{
            background: 'var(--accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ArrowLeft size={16} />
          {t('debtDetail.back')}
        </button>
      </div>
    );
  }


  return (
    <div
      style={{
        padding: 16,
        maxWidth: 960,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingBottom: 100,
      }}
    >
      {/* ===== 1. Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--bg-primary)',
          paddingTop: 4,
          paddingBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/debts')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={22} />
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 220,
            }}
          >
            {debt.name}
          </h1>
        </div>
        <button
          onClick={() => console.log('Edit debt:', debt.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Pencil size={18} />
        </button>
      </motion.div>

      {/* ===== 2. Progress Ring ===== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        style={{ position: 'relative', textAlign: 'center' }}
      >
        <svg width={160} height={160} style={{ display: 'block', margin: '0 auto' }}>
          <circle
            cx={80}
            cy={80}
            r={70}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={8}
          />
          <circle
            cx={80}
            cy={80}
            r={70}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percentPaid)}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Center text over the SVG */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(Math.round(displayBalance))}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: 'var(--text-tertiary)',
            }}
          >
            {t('debtDetail.paidPercentage', { percent: Math.round(percentPaid * 100) })}
          </p>
        </div>
      </motion.div>

      {/* ===== 3. Stats Row ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ display: 'flex', gap: 8 }}
      >
        {/* Original Amount */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 10px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
            {t('debtDetail.originalAmount')}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(Math.round(debt.totalAmount))}
          </p>
        </div>

        {/* Interest Rate */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 10px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
            {t('debtDetail.interestRate')}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {debt.interestRate}%
          </p>
        </div>

        {/* Monthly Payment */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 10px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
            {t('debtDetail.monthlyPayment')}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(Math.round(debt.monthlyPayment || 0))}
          </p>
        </div>
      </motion.div>

      {/* ===== 4. Payoff Projection Card ===== */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 16px 8px',
          }}
        >
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 12px',
            }}
          >
            {t('debtDetail.payoffProjection')}
          </p>
          <div style={{ height: 160, marginLeft: -10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="debtDetailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                  tickFormatter={(v: number) => formatCurrencyShort(v)}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), t('chart.remainingDebt')]}
                />
                <Area
                  type="monotone"
                  dataKey="remaining"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#debtDetailGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ===== 5. Log Payment Button ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <button
          onClick={() => setShowPaymentModal(true)}
          style={{
            width: '100%',
            height: 48,
            background: 'var(--accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-family)',
          }}
        >
          {t('debtDetail.logPayment')}
        </button>
      </motion.div>

      {/* ===== 6. Transaction History ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
        }}
      >
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 12px',
          }}
        >
          {t('debtDetail.transactionHistory')}
        </p>

        {debtTransactions.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>
            {t('debtDetail.noTransactions')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {debtTransactions.map((tx) => {
              const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>
                      {format(txDate, 'MMM d, yyyy')}
                    </p>
                    {tx.note && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {tx.note}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--coral)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      -{formatCurrency(Math.round(tx.amount))}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 12,
                        color: 'var(--text-tertiary)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatCurrency(Math.round(tx.balanceAfter))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <LogPaymentModal
          debt={debt}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentLogged={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default DebtDetailPage;
