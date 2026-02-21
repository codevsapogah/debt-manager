import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import DebtCard from '../components/DebtCard';
import DebtForm from '../components/DebtForm';
import { CreditCard, Plus } from 'lucide-react';
import { Debt } from '../types';
import { motion } from 'framer-motion';
import GooeyCircleLoader from '../components/GooeyCircleLoader';

const DebtsPage: React.FC = () => {
  const { debts, loading, refreshData } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [filter, setFilter] = useState<'all' | 'active' | 'paidOff'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const filteredDebts = useMemo(() => {
    let result: Debt[];

    switch (filter) {
      case 'active':
        result = debts.filter((d) => d.currentAmount > 0);
        break;
      case 'paidOff':
        result = debts.filter((d) => d.currentAmount <= 0);
        break;
      default:
        result = [...debts];
    }

    // Sort: active debts first, then paid off
    return result.sort((a, b) => {
      const aActive = a.currentAmount > 0 ? 0 : 1;
      const bActive = b.currentAmount > 0 ? 0 : 1;
      return aActive - bActive;
    });
  }, [debts, filter]);

  const filters: { key: 'all' | 'active' | 'paidOff'; label: string }[] = [
    { key: 'all', label: t('debtsPage.all') },
    { key: 'active', label: t('debtsPage.active') },
    { key: 'paidOff', label: t('debtsPage.paidOff') },
  ];

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

  return (
    <div
      style={{
        padding: 16,
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {t('debtsPage.title')}
        </h1>
        <button
          onClick={() => {
            setEditingDebt(null);
            setShowForm(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          {t('debtsPage.addDebt')}
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8 }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
              border: filter === f.key ? '1.5px solid var(--accent)' : '1.5px solid var(--accent)',
              background: filter === f.key ? 'var(--accent)' : 'transparent',
              color: filter === f.key ? '#FFFFFF' : 'var(--accent)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Debt list or empty state */}
      {filteredDebts.length === 0 ? (
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
            paddingTop: 60,
            paddingBottom: 60,
          }}
        >
          <CreditCard size={48} style={{ color: 'var(--text-tertiary)' }} />
          <div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 4px',
              }}
            >
              {t('debtsPage.noDebts')}
            </p>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              {t('debtsPage.noDebtsDescription')}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingDebt(null);
              setShowForm(true);
            }}
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--accent)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            {t('debt.addDebt')}
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredDebts.map((debt, index) => (
            <motion.div
              key={debt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <DebtCard
                debt={debt}
                onClick={() => navigate(`/debts/${debt.id}`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Debt Form Modal */}
      {showForm && (
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
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              padding: 24,
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>
                {editingDebt ? t('debt.editDebt') : t('debt.addDebt')}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingDebt(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: 20,
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <DebtForm
              onDebtAdded={() => {
                refreshData();
                setShowForm(false);
              }}
              editingDebt={editingDebt}
              onEditComplete={() => {
                refreshData();
                setShowForm(false);
                setEditingDebt(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;
