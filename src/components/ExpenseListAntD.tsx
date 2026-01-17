import React from 'react';
import { Card, List, Tag, Button, Space, Typography, Empty, Checkbox } from 'antd';
import { EditOutlined, DeleteOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { RecurringExpense } from '../types';
import { deleteRecurringExpense, updateRecurringExpense } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../contexts/AuthContext';

const { Text, Title } = Typography;

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
  const { currentUser } = useAuth();

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
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="text-sm opacity-90 mb-2">{t('expense.totalMonthlyExpenses')}</div>
        <div className="text-3xl font-bold">-{formatCurrency(getTotalMonthlyExpenses())}</div>
      </div>

      {/* Expenses List */}
      <Card
        className="shadow-sm rounded-xl"
        title={
          <Space>
            <ShoppingOutlined />
            <span>{t('expense.expenses')}</span>
            <Tag color="blue">{expenses.length} {t('expense.expensesCount')}</Tag>
          </Space>
        }
        bodyStyle={{ padding: 0 }}
      >
        <List
          dataSource={expenses}
          renderItem={(expense) => (
            <List.Item
              className="hover:bg-gray-50 px-6"
              actions={[
                <Button
                  key="edit"
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onExpenseEdit && onExpenseEdit(expense)}
                  className="text-blue-500 hover:text-blue-700"
                />,
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(expense.id)}
                />
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Checkbox
                    checked={expense.includeInTotal !== false}
                    onChange={() => handleToggleIncludeInTotal(expense)}
                  />
                }
                title={
                  <Space>
                    <span className="font-semibold text-gray-900">{expense.name}</span>
                    {expense.category && (
                      <Tag color="default" style={{ fontSize: '11px' }}>
                        {expense.category}
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Space size="small">
                      <Tag color={getFrequencyColor(expense.frequency)} style={{ fontSize: '11px' }}>
                        {t(`expense.frequencies.${expense.frequency}`)}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatCurrency(expense.amount)}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        → {formatCurrency(convertToMonthly(expense))}/мес
                      </Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default ExpenseListAntD;
