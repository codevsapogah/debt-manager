import React, { useState } from 'react';
import { Button, Tag, Space, Checkbox, Modal, message, Dropdown, Progress } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  TrophyOutlined,
  MoreOutlined,
  DollarOutlined,
  BankOutlined,
  CreditCardOutlined,
  HomeOutlined,
  CarOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { Debt } from '../types';
import { addDebt } from '../utils/storage';
import { calculateCurrentBalance } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import { exportToCSV, exportToJSON } from '../utils/export';

interface DebtListAntDProps {
  debts: Debt[];
  onOptimisticDelete: (ids: string[]) => void;
  onOptimisticUpdate: (ids: string[], updates: Partial<Debt>) => void;
  onSync: (action: 'delete' | 'update', ids: string[], updates?: Partial<Debt>) => Promise<void>;
  onDebtEdit: (debt: Debt) => void;
}

const DebtListAntD: React.FC<DebtListAntDProps> = ({
  debts,
  onOptimisticDelete,
  onOptimisticUpdate,
  onSync,
  onDebtEdit
}) => {
  const { t } = useTranslation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [hidePaidOff, setHidePaidOff] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(
    localStorage.getItem('debt-delete-no-confirm') === 'true'
  );

  const isPaidOff = (debt: Debt) => {
    const { currentBalance } = calculateCurrentBalance(debt);
    const actualCurrentBalance = debt.currentAmount !== debt.totalAmount
      ? debt.currentAmount
      : currentBalance;
    return actualCurrentBalance <= 0;
  };

  const filteredDebts = hidePaidOff ? debts.filter(debt => !isPaidOff(debt)) : debts;

  // Helper to get icon and color for each debt
  const getDebtIconAndColor = (debt: Debt, index: number): { icon: React.ReactNode; color: string; bgColor: string } => {
    const colors = [
      { color: '#6C5CE7', bgColor: 'rgba(108, 92, 231, 0.15)', icon: <BankOutlined /> },
      { color: '#FFAA00', bgColor: 'rgba(255, 170, 0, 0.15)', icon: <CreditCardOutlined /> },
      { color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.15)', icon: <ShoppingOutlined /> },
      { color: '#4ECDC4', bgColor: 'rgba(78, 205, 196, 0.15)', icon: <DollarOutlined /> },
      { color: '#00D68F', bgColor: 'rgba(0, 214, 143, 0.15)', icon: <HomeOutlined /> },
      { color: '#8B8FA3', bgColor: 'rgba(139, 143, 163, 0.15)', icon: <CarOutlined /> },
    ];

    // Assign color based on hash of debt name for consistency
    const hash = debt.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;

    return colors[colorIndex];
  };

  const handleDelete = (ids: string[]) => {
    if (dontAskAgain) {
      onOptimisticDelete(ids);
      setSelectedRowKeys([]);
      onSync('delete', ids);
      message.success(t('debt.deleteSuccess') || 'Deleted successfully');
    } else {
      Modal.confirm({
        title: t('debt.confirmDelete'),
        content: ids.length === 1
          ? t('debt.confirmDeleteSingle')
          : t('debt.confirmDeleteMultiple', { count: ids.length }),
        okText: t('common.delete'),
        cancelText: t('common.cancel'),
        okType: 'danger',
        onOk: async () => {
          onOptimisticDelete(ids);
          setSelectedRowKeys([]);
          await onSync('delete', ids);
          message.success(t('debt.deleteSuccess') || 'Deleted successfully');
        },
        footer: (_, { OkBtn, CancelBtn }) => (
          <div>
            <Checkbox
              checked={dontAskAgain}
              onChange={(e) => {
                setDontAskAgain(e.target.checked);
                localStorage.setItem('debt-delete-no-confirm', e.target.checked.toString());
              }}
              className="float-left mt-2"
            >
              {t('debt.dontAskAgain')}
            </Checkbox>
            <Space className="float-right">
              <CancelBtn />
              <OkBtn />
            </Space>
          </div>
        ),
      });
    }
  };

  const handleBulkMarkPaid = async () => {
    const ids = selectedRowKeys as string[];
    onOptimisticUpdate(ids, { currentAmount: 0 });
    message.success({
      content: ids.length === 1 ? t('debt.congratsSingle') : t('debt.congratsMultiple', { count: ids.length }),
      icon: <TrophyOutlined style={{ color: '#10b981' }} />,
      duration: 3,
    });
    await onSync('update', ids, { currentAmount: 0 });
    setSelectedRowKeys([]);
  };

  const handleBulkToggleInclude = async () => {
    const ids = selectedRowKeys as string[];
    const firstDebt = debts.find(d => d.id === ids[0]);
    const newValue = !(firstDebt?.includeInTotal ?? true);
    onOptimisticUpdate(ids, { includeInTotal: newValue });
    await onSync('update', ids, { includeInTotal: newValue });
    setSelectedRowKeys([]);
    message.success(t('debt.updateSuccess') || 'Updated successfully');
  };

  const handleExport = (format: 'csv' | 'json') => {
    const selectedDebtObjects = debts.filter(d => selectedRowKeys.includes(d.id));
    const debtsToExport = selectedRowKeys.length > 0 ? selectedDebtObjects : debts;

    if (format === 'csv') {
      exportToCSV(debtsToExport);
    } else {
      exportToJSON(debtsToExport);
    }
    message.success(`Exported ${debtsToExport.length} debts as ${format.toUpperCase()}`);
  };

  const handleDuplicate = async (debt: Debt) => {
    const duplicatedDebt: Debt = {
      ...debt,
      id: uuidv4(),
      name: `${debt.name} ${t('debt.copy')}`,
      currentAmount: debt.totalAmount,
    };
    await addDebt(duplicatedDebt);
    message.success(t('debt.duplicateSuccess') || 'Duplicated successfully');
    window.location.reload();
  };

  const handleSelectDebt = (debtId: string) => {
    const newSelectedKeys = selectedRowKeys.includes(debtId)
      ? selectedRowKeys.filter(id => id !== debtId)
      : [...selectedRowKeys, debtId];
    setSelectedRowKeys(newSelectedKeys);
  };

  const handleSelectAll = () => {
    if (selectedRowKeys.length === filteredDebts.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(filteredDebts.map(debt => debt.id));
    }
  };

  // Calculate totals
  const includedDebts = filteredDebts.filter(debt => debt.includeInTotal !== false);
  const totalOriginalDebt = includedDebts.reduce((sum, debt) => sum + debt.totalAmount, 0);
  const totalCurrentDebt = includedDebts.reduce((sum, debt) => {
    const { currentBalance } = calculateCurrentBalance(debt);
    const actualBalance = debt.currentAmount !== debt.totalAmount ? debt.currentAmount : currentBalance;
    return sum + actualBalance;
  }, 0);
  const totalPaidOff = totalOriginalDebt - totalCurrentDebt;
  const totalProgressPercent = totalOriginalDebt > 0 ? (totalPaidOff / totalOriginalDebt) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Debt Card */}
        <div
          style={{
            background: 'var(--bg-surface-glass)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            padding: '28px',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderTop: '3px solid var(--accent)',
          }}
        >
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '12px',
            color: 'var(--text-secondary)'
          }}>
            {t('overview.currentDebt')}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(totalCurrentDebt)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Total Debt
          </div>
        </div>

        {/* Paid Off Card */}
        <div
          style={{
            background: 'var(--bg-surface-glass)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            padding: '28px',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderTop: '3px solid var(--success)',
          }}
        >
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '12px',
            color: 'var(--text-secondary)'
          }}>
            {t('overview.totalPaidOff')}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(totalPaidOff)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Total Paid
          </div>
        </div>

        {/* Overall Progress Card */}
        <div
          style={{
            background: 'var(--bg-surface-glass)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            padding: '28px',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderTop: '3px solid var(--warning)',
          }}
        >
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '12px',
            color: 'var(--text-secondary)'
          }}>
            {t('overview.overallProgress')}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
            {totalProgressPercent.toFixed(1)}%
          </div>
          <Progress
            percent={Math.round(totalProgressPercent)}
            strokeColor="#6C5CE7"
            strokeWidth={8}
            showInfo={false}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'var(--bg-surface)',
        padding: '20px 24px',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)'
      }}>
        <Space size="large">
          <Button
            icon={hidePaidOff ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={() => setHidePaidOff(!hidePaidOff)}
            className="font-medium"
          >
            {hidePaidOff ? t('debt.showPaidOff') : t('debt.hidePaidOff')}
          </Button>
        </Space>

        {selectedRowKeys.length > 0 && (
          <Space>
            <Tag color="blue" className="text-base px-3 py-1">
              {t('debt.selectedCount', { count: selectedRowKeys.length })}
            </Tag>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleBulkMarkPaid}
              className="bg-green-500 hover:bg-green-600"
            >
              {t('debt.markAsPaid')}
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => handleExport('csv')}
            >
              {t('debt.export')} CSV
            </Button>
            <Button
              onClick={() => handleExport('json')}
            >
              {t('debt.export')} JSON
            </Button>
            <Button onClick={handleBulkToggleInclude}>
              {t('debt.toggleInclude')}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(selectedRowKeys as string[])}
            >
              {t('common.delete')}
            </Button>
          </Space>
        )}
      </div>

      {/* Transaction List */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* List Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Checkbox
              checked={selectedRowKeys.length === filteredDebts.length && filteredDebts.length > 0}
              indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < filteredDebts.length}
              onChange={handleSelectAll}
            />
            <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {t('debt.debts')} ({filteredDebts.length})
            </span>
          </div>
        </div>

        {/* Transaction Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredDebts.map((debt, index) => {
            const { currentBalance } = calculateCurrentBalance(debt);
            const actualCurrentBalance = debt.currentAmount !== debt.totalAmount
              ? debt.currentAmount
              : currentBalance;
            const progressPercent = debt.totalAmount > 0
              ? ((debt.totalAmount - actualCurrentBalance) / debt.totalAmount) * 100
              : 0;
            const { icon, color, bgColor } = getDebtIconAndColor(debt, index);
            const paidOff = isPaidOff(debt);

            return (
              <div
                key={debt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: paidOff ? 'var(--bg-item-paid)' : 'var(--bg-item)',
                  borderRadius: '16px',
                  border: `1px solid ${paidOff ? 'var(--border-paid)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = paidOff ? 'var(--bg-item-paid-hover)' : 'var(--bg-item-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = paidOff ? 'var(--bg-item-paid)' : 'var(--bg-item)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={selectedRowKeys.includes(debt.id)}
                  onChange={() => handleSelectDebt(debt.id)}
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
                      {debt.name}
                    </span>
                    {paidOff && (
                      <Tag icon={<TrophyOutlined />} color="success" style={{ fontSize: '11px' }}>
                        {t('debt.paidOff')}
                      </Tag>
                    )}
                  </div>

                  {/* Details Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <Tag color={debt.interestRate > 30 ? 'error' : debt.interestRate > 15 ? 'warning' : 'default'} style={{ fontSize: '11px' }}>
                      {debt.interestRate.toFixed(1)}%
                    </Tag>
                    {debt.monthlyPayment && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatCurrency(debt.monthlyPayment)}/мес
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: '120px', maxWidth: '200px' }}>
                      <Progress
                        percent={Math.round(progressPercent)}
                        strokeColor={{
                          '0%': color,
                          '100%': '#10b981',
                        }}
                        strokeWidth={6}
                        size="small"
                        format={(percent) => `${percent}%`}
                        style={{ fontSize: '11px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', marginRight: '12px' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: paidOff ? 'var(--success)' : 'var(--text-primary)',
                    marginBottom: '4px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {formatCurrency(actualCurrentBalance)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {t('table.of')} {formatCurrency(debt.totalAmount)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={debt.includeInTotal !== false}
                    onChange={() => {
                      const newValue = !(debt.includeInTotal ?? true);
                      onOptimisticUpdate([debt.id], { includeInTotal: newValue });
                      onSync('update', [debt.id], { includeInTotal: newValue });
                    }}
                    title={t('table.inTotal')}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDebtEdit(debt);
                    }}
                    style={{ color: 'var(--accent)' }}
                  />
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'duplicate',
                          icon: <CopyOutlined />,
                          label: t('debt.duplicate'),
                          onClick: () => handleDuplicate(debt),
                        },
                        {
                          key: 'delete',
                          icon: <DeleteOutlined />,
                          label: t('common.delete'),
                          danger: true,
                          onClick: () => handleDelete([debt.id]),
                        },
                      ],
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              </div>
            );
          })}

          {filteredDebts.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-tertiary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}><DollarOutlined /></div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {hidePaidOff ? t('debt.noPaidOffDebts') : t('debt.noDebts')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtListAntD;
