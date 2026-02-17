import React from 'react';
import { Tag, Button, Space, Typography, Empty, Checkbox } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  CarOutlined,
  ShoppingOutlined,
  CoffeeOutlined,
  MedicineBoxOutlined,
  BookOutlined,
  PhoneOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { RecurringExpense } from '../types';
import { deleteRecurringExpense, updateRecurringExpense } from '../utils/storage';
import { formatCurrency } from '../utils/currency';

const { Text } = Typography;

interface ExpenseListAntDProps {
  expenses: RecurringExpense[];
  onExpenseDeleted: () => void;
  onExpenseEdit?: (expense: RecurringExpense) => void;
}

const ExpenseListAntD: React.FC<ExpenseListAntDProps> = ({
  expenses,
  onExpenseDeleted,
  onExpenseEdit
}) => {
  const { t } = useTranslation();

  const handleDelete = async (id: string) => {
    if (window.confirm(t('expense.deleteConfirm'))) {
      await deleteRecurringExpense(id);
      onExpenseDeleted();
    }
  };

  const handleToggleIncludeInTotal = async (expense: RecurringExpense) => {
    const updatedExpense = {
      ...expense,
      includeInTotal: expense.includeInTotal === false ? true : false
    };
    await updateRecurringExpense(updatedExpense);
    onExpenseDeleted();
  };

  const convertToMonthly = (expense: RecurringExpense): number => {
    switch (expense.frequency) {
      case 'weekly':
        return expense.amount * 4.33;
      case 'biweekly':
        return expense.amount * 2.17;
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

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'blue';
      case 'biweekly': return 'cyan';
      case 'monthly': return 'green';
      case 'yearly': return 'purple';
      default: return 'default';
    }
  };

  // Helper to get icon and color for each expense
  const getExpenseIconAndColor = (expense: RecurringExpense): { icon: React.ReactNode; color: string; bgColor: string } => {
    const categoryMap: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
      'Rent': { icon: <HomeOutlined />, color: '#6C5CE7', bgColor: 'rgba(108, 92, 231, 0.15)' },
      'Transport': { icon: <CarOutlined />, color: '#FFAA00', bgColor: 'rgba(255, 170, 0, 0.15)' },
      'Shopping': { icon: <ShoppingOutlined />, color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.15)' },
      'Food': { icon: <CoffeeOutlined />, color: '#4ECDC4', bgColor: 'rgba(78, 205, 196, 0.15)' },
      'Health': { icon: <MedicineBoxOutlined />, color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.15)' },
      'Education': { icon: <BookOutlined />, color: '#6C5CE7', bgColor: 'rgba(108, 92, 231, 0.15)' },
      'Utilities': { icon: <PhoneOutlined />, color: '#00D68F', bgColor: 'rgba(0, 214, 143, 0.15)' },
    };

    // Try to match category
    if (expense.category && categoryMap[expense.category]) {
      return categoryMap[expense.category];
    }

    // Default based on hash
    const colors = [
      { color: '#6C5CE7', bgColor: 'rgba(108, 92, 231, 0.15)', icon: <DollarOutlined /> },
      { color: '#FFAA00', bgColor: 'rgba(255, 170, 0, 0.15)', icon: <ShoppingOutlined /> },
      { color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.15)', icon: <CoffeeOutlined /> },
      { color: '#4ECDC4', bgColor: 'rgba(78, 205, 196, 0.15)', icon: <HomeOutlined /> },
      { color: '#00D68F', bgColor: 'rgba(0, 214, 143, 0.15)', icon: <PhoneOutlined /> },
      { color: '#8B8FA3', bgColor: 'rgba(139, 143, 163, 0.15)', icon: <CarOutlined /> },
    ];

    const hash = expense.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
  };

  if (expenses.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        padding: '60px 24px',
        border: '1px solid var(--border-subtle)',
        textAlign: 'center'
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical">
              <Text type="secondary">{t('expense.noExpenses')}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t('expense.addExpenseHint')}
              </Text>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Summary Card */}
      <div
        style={{
          background: 'var(--bg-surface-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '24px',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          borderTop: '3px solid var(--error)',
        }}
      >
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          {t('expense.totalMonthlyExpenses')}
        </div>
        <div style={{ fontSize: '30px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--error)' }}>
          -{formatCurrency(getTotalMonthlyExpenses())}
        </div>
      </div>

      {/* Expenses List */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* List Header */}
        <div style={{
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {t('expense.recurringExpenses')} ({expenses.length})
          </span>
        </div>

        {/* Expense Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {expenses.map((expense) => {
            const { icon, color, bgColor } = getExpenseIconAndColor(expense);
            const monthlyAmount = convertToMonthly(expense);

            return (
              <div
                key={expense.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: 'var(--bg-item)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-item-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-item)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={expense.includeInTotal !== false}
                  onChange={() => handleToggleIncludeInTotal(expense)}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Circular Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '20px',
                  color: color
                }}>
                  {icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {expense.name}
                    </span>
                    {expense.category && (
                      <Tag color="default" style={{ fontSize: '11px' }}>
                        {expense.category}
                      </Tag>
                    )}
                  </div>

                  {/* Details Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <Tag color={getFrequencyColor(expense.frequency)} style={{ fontSize: '11px' }}>
                      {t(`expense.frequencies.${expense.frequency}`)}
                    </Tag>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {formatCurrency(expense.amount)}
                    </span>
                    {expense.frequency !== 'monthly' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        → {formatCurrency(monthlyAmount)}/мес
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', marginRight: '12px' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--error)',
                    marginBottom: '4px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    -{formatCurrency(monthlyAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {t('expense.perMonth')}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpenseEdit && onExpenseEdit(expense);
                    }}
                    style={{ color: 'var(--accent)' }}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(expense.id);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExpenseListAntD;
