import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import { IncomeSource } from '../types';
import IncomeForm from '../components/IncomeForm';
import IncomeList from '../components/IncomeList';

const IncomePage: React.FC = () => {
  const { t } = useTranslation();
  const { incomes, refreshData } = useData();
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);

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
        {t('settings.manageIncome')}
      </h1>

      <IncomeForm
        onIncomeAdded={refreshData}
        editingIncome={editingIncome}
        onEditComplete={() => { setEditingIncome(null); refreshData(); }}
      />

      <div style={{ marginTop: 16 }}>
        <IncomeList
          incomes={incomes}
          onIncomeDeleted={refreshData}
          onIncomeEdit={setEditingIncome}
        />
      </div>
    </div>
  );
};

export default IncomePage;
