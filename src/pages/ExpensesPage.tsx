import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import { RecurringExpense } from '../types';
import { deleteRecurringExpense } from '../utils/storage';
import { formatCurrency } from '../utils/currency';
import ExpenseForm from '../components/ExpenseForm';
import { Trash2, Edit2 } from 'lucide-react';

const ExpensesPage: React.FC = () => {
  const { t } = useTranslation();
  const { expenses, refreshData } = useData();
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  return (
    <div style={{ padding: 16, maxWidth: 960, margin: '0 auto' }}>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 16px',
        }}
      >
        {t('settings.manageExpenses')}
      </h1>

      <ExpenseForm
        onExpenseAdded={() => { refreshData(); setEditingExpense(null); }}
        editingExpense={editingExpense}
        onEditComplete={() => { setEditingExpense(null); refreshData(); }}
      />

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {expenses.map(exp => (
          <div key={exp.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{exp.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {exp.frequency}{exp.category ? ` / ${exp.category}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(exp.amount)}
              </span>
              <button
                onClick={() => setEditingExpense(exp)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, color: 'var(--text-tertiary)', display: 'flex',
                }}
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={async () => {
                  if (window.confirm(t('expense.deleteConfirm'))) {
                    await deleteRecurringExpense(exp.id);
                    refreshData();
                  }
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 4, color: 'var(--text-tertiary)', display: 'flex',
                }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <div style={{
            padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14,
          }}>
            {t('expense.noExpenses')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesPage;
