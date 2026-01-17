import React from 'react';
import { Card, Tag, Button, Space, Typography, Empty, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
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

  if (expenses.length === 0) {
    return (
      <Card className="shadow-sm rounded-xl">
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
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Summary Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
        }}
      >
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
          {t('expense.totalMonthlyExpenses')}
        </div>
        <div style={{ fontSize: '30px', fontWeight: 'bold' }}>
          -{formatCurrency(getTotalMonthlyExpenses())}
        </div>
      </div>

      {/* Expenses List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {expenses.map((expense) => (
          <Card
            key={expense.id}
            className="shadow-sm rounded-xl hover:bg-gray-50"
            bodyStyle={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {/* Checkbox */}
              <Checkbox
                checked={expense.includeInTotal !== false}
                onChange={() => handleToggleIncludeInTotal(expense)}
                style={{ marginTop: '2px' }}
              />

              {/* Content */}
              <div style={{ flex: 1 }}>
                {/* Title Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Text strong style={{ fontSize: '14px' }}>{expense.name}</Text>
                  {expense.category && (
                    <Tag color="default" style={{ fontSize: '11px', margin: 0 }}>
                      {expense.category}
                    </Tag>
                  )}
                </div>

                {/* Details Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Tag color={getFrequencyColor(expense.frequency)} style={{ fontSize: '11px', margin: 0 }}>
                    {t(`expense.frequencies.${expense.frequency}`)}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatCurrency(expense.amount)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    → {formatCurrency(convertToMonthly(expense))}/мес
                  </Text>
                </div>
              </div>

              {/* Actions */}
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onExpenseEdit && onExpenseEdit(expense)}
                  className="text-blue-500 hover:text-blue-700"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(expense.id)}
                />
              </Space>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExpenseListAntD;
