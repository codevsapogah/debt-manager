import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { Debt, IncomeSource, RecurringExpense } from '../types';
import {
  calculateTotalDebtProjection,
  calculateSnowballProjection,
  calculateCompleteDebtTimeline,
  PaymentStrategy
} from '../utils/calculations';
import { formatCurrency, formatCurrencyShort } from '../utils/currency';
import { format } from 'date-fns';

interface DebtChartProps {
  debts: Debt[];
  incomes: IncomeSource[];
  expenses?: RecurringExpense[];
}

const DebtChart: React.FC<DebtChartProps> = ({ debts, incomes, expenses = [] }) => {
  const { t } = useTranslation();
  const [paymentStrategy, setPaymentStrategy] = useState<PaymentStrategy | null>(null);
  const [useCompleteTimeline, setUseCompleteTimeline] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [interestThreshold, setInterestThreshold] = useState(5);
  
  const getTotalMonthlyIncome = (): number => {
    return incomes
      .filter(income => income.includeInTotal !== false)
      .reduce((total, income) => {
        switch (income.frequency) {
          case 'weekly':
            return total + income.amount * 4.33;
          case 'biweekly':
            return total + income.amount * 2.17;
          case 'yearly':
            return total + income.amount / 12;
          case 'monthly':
          default:
            return total + income.amount;
        }
      }, 0);
  };

  const getTotalMonthlyExpenses = (): number => {
    return expenses
      .filter(expense => expense.includeInTotal !== false)
      .reduce((total, expense) => {
        switch (expense.frequency) {
          case 'weekly':
            return total + expense.amount * 4.33;
          case 'biweekly':
            return total + expense.amount * 2.17;
          case 'yearly':
            return total + expense.amount / 12;
          case 'monthly':
          default:
            return total + expense.amount;
        }
      }, 0);
  };

  const getTotalMonthlyDebtPayments = (): number => {
    return debts.filter(debt => debt.includeInTotal !== false)
      .reduce((total, debt) => total + (debt.monthlyPayment || 0), 0);
  };

  const monthlyIncome = getTotalMonthlyIncome();
  const monthlyExpenses = getTotalMonthlyExpenses();
  const monthlyDebtPayments = getTotalMonthlyDebtPayments();
  const monthlyRemaining = monthlyIncome - monthlyExpenses - monthlyDebtPayments;

  const adjustedMonthlyIncome = monthlyIncome - monthlyExpenses;
  const projection = useCompleteTimeline
    ? calculateCompleteDebtTimeline(debts, paymentStrategy, adjustedMonthlyIncome, interestThreshold)
    : paymentStrategy
      ? calculateSnowballProjection(debts, adjustedMonthlyIncome, paymentStrategy, interestThreshold)
      : calculateTotalDebtProjection(debts);

  const chartData = projection.map((point, index) => {
    // Calculate actual monthly payment for this month (could be less in final months)
    const previousPoint = index > 0 ? projection[index - 1] : null;
    const monthlyPaymentThisMonth = previousPoint 
      ? point.totalPaid - previousPoint.totalPaid 
      : point.totalPaid;
    
    // Calculate remaining money after debt payments and expenses
    const remainingAfterDebt = monthlyIncome - monthlyExpenses - monthlyPaymentThisMonth;
    
    return {
      month: `Month ${point.month}`,
      date: format(point.date, 'MMM yyyy'),
      remainingDebt: point.remainingDebt,
      totalPaid: point.totalPaid,
      interestPaid: point.interestPaid,
      monthlyPayment: monthlyPaymentThisMonth,
      remainingMoney: remainingAfterDebt,
      availableIncome: monthlyRemaining * (index + 1) // Cumulative available income
    };
  });

  const payoffDate = projection.length > 0
    ? projection[projection.length - 1].date
    : null;

  // Calculate strategy metrics for comparison
  const calculateStrategyMetrics = (strategy: PaymentStrategy | null) => {
    const proj = useCompleteTimeline
      ? calculateCompleteDebtTimeline(debts, strategy, adjustedMonthlyIncome, interestThreshold)
      : strategy
        ? calculateSnowballProjection(debts, adjustedMonthlyIncome, strategy, interestThreshold)
        : calculateTotalDebtProjection(debts);

    if (proj.length === 0) return null;

    const lastPoint = proj[proj.length - 1];
    return {
      totalInterest: lastPoint.interestPaid,
      totalPaid: lastPoint.totalPaid,
      monthsToPayoff: proj.length,
      payoffDate: lastPoint.date
    };
  };

  // Get which debt is being targeted with current strategy
  const getTargetedDebt = () => {
    if (!paymentStrategy) return null;

    const includedDebts = debts.filter(debt =>
      debt.includeInTotal !== false && debt.monthlyPayment && debt.monthlyPayment > 0
    );

    if (includedDebts.length === 0) return null;

    // Sort based on strategy to find first target
    const sorted = [...includedDebts];
    switch (paymentStrategy) {
      case 'snowball':
        sorted.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case 'avalanche':
        sorted.sort((a, b) => b.interestRate - a.interestRate);
        break;
      case 'cashflow':
        sorted.sort((a, b) => (b.monthlyPayment || 0) - (a.monthlyPayment || 0));
        break;
      case 'smart':
        const highInterest = sorted.filter(d => d.interestRate >= interestThreshold);
        const lowInterest = sorted.filter(d => d.interestRate < interestThreshold);
        highInterest.sort((a, b) => b.interestRate - a.interestRate);
        lowInterest.sort((a, b) => a.totalAmount - b.totalAmount);
        sorted.length = 0;
        sorted.push(...highInterest, ...lowInterest);
        break;
    }

    return sorted[0];
  };

  const targetedDebt = getTargetedDebt();

  // Find current month in the timeline for reference line
  const currentDate = new Date();
  const currentMonthKey = useCompleteTimeline 
    ? format(currentDate, 'MMM yyyy')
    : null;

  if (debts.length === 0) {
    return <div className="no-data">Add some debts to see projections</div>;
  }

  return (
    <div className="debt-charts">
      <div className="financial-summary">
        <h3>{t('overview.financialSummary')}</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <strong>{t('overview.monthlyIncome')}</strong> {formatCurrency(monthlyIncome)}
          </div>
          {monthlyExpenses > 0 && (
            <div className="summary-item">
              <strong>{t('overview.monthlyExpenses')}</strong> {formatCurrency(monthlyExpenses)}
            </div>
          )}
          <div className="summary-item">
            <strong>{t('overview.monthlyDebtPayments')}</strong> {formatCurrency(monthlyDebtPayments)}
          </div>
          <div className="summary-item">
            <strong>{t('overview.monthlyAvailable')}</strong> 
            <span className={monthlyRemaining >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(monthlyRemaining)}
            </span>
          </div>
          {payoffDate && (
            <div className="summary-item">
              <strong>{t('overview.debtFreeDate')}</strong> {format(payoffDate, 'MMMM yyyy')}
            </div>
          )}
        </div>
      </div>

      {/* Strategy Explanation and Targeted Debt */}
      {paymentStrategy && (
        <div className="strategy-info-section">
          <div className="strategy-explanation">
            <h4>{t('chart.strategyExplanation')}</h4>
            <p className="strategy-description">
              {t(`chart.strategyDescriptions.${paymentStrategy}`)}
            </p>
            {targetedDebt && (
              <div className="targeted-debt">
                <strong>{t('chart.currentlyTargeting')}:</strong>
                <span className="debt-target">
                  {targetedDebt.name}
                  ({t('chart.balance')}: {formatCurrency(targetedDebt.totalAmount)},
                  {t('chart.rate')}: {targetedDebt.interestRate}%,
                  {t('chart.payment')}: {formatCurrency(targetedDebt.monthlyPayment || 0)})
                </span>
              </div>
            )}
          </div>

          <button
            className="compare-btn"
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? t('chart.hideComparison') : t('chart.showComparison')}
          </button>

          {/* Strategy Comparison */}
          {showComparison && (
            <div className="strategy-comparison">
              <h4>{t('chart.strategyComparison')}</h4>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>{t('chart.strategy')}</th>
                    <th>{t('chart.totalInterest')}</th>
                    <th>{t('chart.totalAmountPaid')}</th>
                    <th>{t('chart.payoffTime')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[null, 'snowball', 'avalanche', 'cashflow', 'smart'].map(strategy => {
                    const metrics = calculateStrategyMetrics(strategy as PaymentStrategy | null);
                    if (!metrics) return null;
                    return (
                      <tr key={strategy || 'standard'} className={paymentStrategy === strategy ? 'active-strategy' : ''}>
                        <td>{t(`chart.strategies.${strategy || 'standard'}`)}</td>
                        <td>{formatCurrency(metrics.totalInterest)}</td>
                        <td>{formatCurrency(metrics.totalPaid)}</td>
                        <td>{metrics.monthsToPayoff} {t('chart.months')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="chart-section">
        <div className="chart-header">
          <h3>{t('chart.debtReductionTimeline')}</h3>
          <div className="chart-controls">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={useCompleteTimeline}
                onChange={(e) => setUseCompleteTimeline(e.target.checked)}
              />
              <span className="toggle-text">{t('chart.completeTimeline')}</span>
            </label>
            <div className="strategy-selector">
              <label className="strategy-label">{t('chart.paymentStrategy')}:</label>
              <select
                className="strategy-select"
                value={paymentStrategy || 'standard'}
                onChange={(e) => setPaymentStrategy(e.target.value === 'standard' ? null : e.target.value as PaymentStrategy)}
              >
                <option value="standard">{t('chart.strategies.standard')}</option>
                <option value="snowball">{t('chart.strategies.snowball')}</option>
                <option value="avalanche">{t('chart.strategies.avalanche')}</option>
                <option value="cashflow">{t('chart.strategies.cashflow')}</option>
                <option value="smart">{t('chart.strategies.smart')}</option>
              </select>
            </div>
            {paymentStrategy === 'smart' && (
              <div className="threshold-control">
                <label className="threshold-label">
                  {t('chart.interestThreshold')}: {interestThreshold}%
                </label>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="0.5"
                  value={interestThreshold}
                  onChange={(e) => setInterestThreshold(parseFloat(e.target.value))}
                  className="threshold-slider"
                />
                <span className="threshold-hint">{t('chart.thresholdHint')}</span>
              </div>
            )}

            {/* Extra Payment Controls */}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(value) => formatCurrencyShort(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            {useCompleteTimeline && currentMonthKey && (
              <ReferenceLine 
                x={currentMonthKey} 
                stroke="#ff0000" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
            <Line
              type="monotone"
              dataKey="remainingDebt"
              stroke="#ff6b6b"
              strokeWidth={3}
              name="Remaining Debt"
            />
            <Line
              type="monotone"
              dataKey="totalPaid"
              stroke="#4ecdc4"
              strokeWidth={2}
              name="Total Paid"
            />
            <Line
              type="monotone"
              dataKey="monthlyPayment"
              stroke="#ff9f43"
              strokeWidth={2}
              name={t('chart.monthlyDebtPayment')}
            />
            <Line
              type="monotone"
              dataKey="remainingMoney"
              stroke="#10ac84"
              strokeWidth={2}
              name="Money Left After Payments"
            />
            <Line
              type="monotone"
              dataKey="availableIncome"
              stroke="#45b7d1"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Cumulative Available Income"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3>Interest vs Principal Payments</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.slice(0, 24)}> {/* Show first 24 months */}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              interval={2}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrencyShort(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name
              ]}
            />
            <Legend />
            <Bar dataKey="interestPaid" fill="#ff9999" name="Interest Paid" />
            <Bar dataKey="totalPaid" fill="#99ccff" name="Total Paid" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DebtChart;