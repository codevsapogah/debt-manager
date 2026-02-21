import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatCurrencyShort } from '../utils/currency';
import { calculateTotalDebtProjection } from '../utils/calculations';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Plus, TrendingDown, TrendingUp, ArrowRight, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addMonths, differenceInDays } from 'date-fns';
// Types used indirectly via useData context
// import { Debt, IncomeSource, RecurringExpense } from '../types';
import GooeyCircleLoader from '../components/GooeyCircleLoader';

function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'biweekly':
      return (amount * 26) / 12;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

const HomePage: React.FC = () => {
  const { debts, incomes, expenses, loading } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const activeDebts = useMemo(
    () => debts.filter((d) => d.includeInTotal !== false && d.currentAmount > 0),
    [debts]
  );

  const totalDebt = useMemo(
    () => activeDebts.reduce((sum, d) => sum + d.currentAmount, 0),
    [activeDebts]
  );

  const totalMonthlyIncome = useMemo(
    () =>
      incomes
        .filter((i) => i.includeInTotal !== false)
        .reduce((sum, i) => sum + toMonthly(i.amount, i.frequency), 0),
    [incomes]
  );

  const totalMonthlyExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.includeInTotal !== false)
        .reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0),
    [expenses]
  );

  const netCashFlow = totalMonthlyIncome - totalMonthlyExpenses;

  const projection = useMemo(
    () => calculateTotalDebtProjection(debts),
    [debts]
  );

  const debtFreeDate = useMemo(() => {
    if (projection.length === 0) return null;
    const last = projection[projection.length - 1];
    if (last.remainingDebt <= 0.01) return last.date;
    return null;
  }, [projection]);

  // Mini sparkline data for hero card: last 6 months downward trend
  const sparklineData = useMemo(() => {
    const points = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = addMonths(now, -i);
      // Simulate a downward trend from a higher amount toward current total
      const factor = 1 + i * 0.06;
      points.push({
        month: format(monthDate, 'MMM'),
        value: Math.round(totalDebt * factor),
      });
    }
    return points;
  }, [totalDebt]);

  // Chart data for debt-free timeline
  const chartData = useMemo(() => {
    if (projection.length === 0) return [];
    // Sample at most ~12 points for the chart
    const step = Math.max(1, Math.floor(projection.length / 12));
    const sampled = projection.filter((_, i) => i % step === 0 || i === projection.length - 1);
    return sampled.map((p) => ({
      month: format(p.date, 'MMM yy'),
      remaining: Math.round(p.remainingDebt),
    }));
  }, [projection]);

  // Next payments: top 3 active debts with monthly payments
  const nextPayments = useMemo(() => {
    return debts
      .filter((d) => d.currentAmount > 0 && d.monthlyPayment && d.monthlyPayment > 0)
      .slice(0, 3)
      .map((d) => {
        // Estimate next payment day based on auto-log day or start date
        const now = new Date();
        const payDay = d.autoLogDay || new Date(d.dateStarted).getDate();
        let nextDate = new Date(now.getFullYear(), now.getMonth(), payDay);
        if (nextDate <= now) {
          nextDate = addMonths(nextDate, 1);
        }
        const daysUntil = differenceInDays(nextDate, now);
        return { ...d, daysUntil };
      });
  }, [debts]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <GooeyCircleLoader loading={true} size={80} colors={['#2563EB', '#3B82F6', '#2563EB']} />
      </div>
    );
  }

  // ---- Empty state ----
  if (debts.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          maxWidth: 600,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 24,
          textAlign: 'center',
        }}
      >
        <CreditCard size={64} style={{ color: 'var(--text-tertiary)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: 0, lineHeight: 1.5 }}>
          {t('home.noDebts')}
        </p>
        <button
          onClick={() => navigate('/debts')}
          style={{
            background: 'var(--accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={20} />
          {t('home.addDebt')}
        </button>
      </div>
    );
  }

  // ---- Main dashboard ----
  return (
    <div
      style={{
        padding: '16px',
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* ===== 1. Hero Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 20px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 13,
            margin: '0 0 4px',
            fontWeight: 500,
          }}
        >
          {t('home.totalDebt')}
        </p>
        <p
          style={{
            color: '#FFFFFF',
            fontSize: 36,
            fontWeight: 800,
            margin: '0 0 4px',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}
        >
          {formatCurrency(Math.round(totalDebt))}
        </p>
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 13,
            margin: 0,
          }}
        >
          {t('home.acrossDebts', { count: activeDebts.length })}
        </p>

        {/* Mini sparkline */}
        <div style={{ height: 80, marginTop: 12, marginLeft: -20, marginRight: -20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id="heroSparkline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={2}
                fill="url(#heroSparkline)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ===== 2. Quick Actions Row ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => navigate('/activity')}
          style={{
            flex: 1,
            background: 'var(--accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={18} />
          {t('home.logPayment')}
        </button>
        <button
          onClick={() => navigate('/debts')}
          style={{
            flex: 1,
            background: 'transparent',
            color: 'var(--accent)',
            border: '1.5px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          <CreditCard size={18} />
          {t('home.addDebt')}
        </button>
      </motion.div>

      {/* ===== 3. Cash Flow Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {t('home.cashFlow')}
          </p>
          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0,
            }}
          >
            {t('home.manage')} <ArrowRight size={14} />
          </button>
        </div>

        {/* Monthly Income */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {t('home.monthlyIncome')}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
            {formatCurrency(Math.round(totalMonthlyIncome))}
          </span>
        </div>

        {/* Monthly Expenses */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={16} style={{ color: 'var(--coral)' }} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {t('home.monthlyExpenses')}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--coral)' }}>
            {formatCurrency(Math.round(totalMonthlyExpenses))}
          </span>
        </div>

        {/* Net Cash Flow bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('home.netCashFlow')}
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: netCashFlow >= 0 ? 'var(--success)' : 'var(--coral)',
            }}
          >
            {netCashFlow >= 0 ? '+' : ''}
            {formatCurrency(Math.round(netCashFlow))}
          </span>
        </div>
      </motion.div>

      {/* ===== 4. Debt-Free Timeline Card ===== */}
      {projection.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px' }}>
            {t('home.debtFreeTimeline')}
          </p>

          <div style={{ height: 200, marginLeft: -10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="debtTimelineGrad" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#debtTimelineGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {debtFreeDate && (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 13,
                color: 'var(--success)',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {t('home.debtFreeBy', { date: format(debtFreeDate, 'MMMM yyyy') })}
            </p>
          )}
        </motion.div>
      )}

      {/* ===== 5. Next Payments Due ===== */}
      {nextPayments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
            {t('home.nextPayments')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nextPayments.map((debt) => (
              <div
                key={debt.id}
                onClick={() => navigate(`/debts/${debt.id}`)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-surface)';
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 2px',
                    }}
                  >
                    {debt.name}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                    {t('home.dueIn', { days: debt.daysUntil })}
                  </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {formatCurrency(debt.monthlyPayment || 0)}
                  </span>
                  <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HomePage;
