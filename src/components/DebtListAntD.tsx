import React, { useState } from 'react';
import { Table, Button, Tag, Space, Checkbox, Modal, message, Dropdown, Progress } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  TrophyOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import type { ColumnsType } from 'antd/es/table';
import { Debt } from '../types';
import { addDebt } from '../utils/storage';
import { calculateDebtProjection, calculateCurrentBalance } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import { format } from 'date-fns';
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

  const columns: ColumnsType<Debt> = [
    {
      title: <span style={{ fontSize: '12px' }}>{t('table.name')}</span>,
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
      render: (name: string, record: Debt) => (
        <Space direction="vertical" size={0}>
          <Space>
            {isPaidOff(record) && (
              <Tag icon={<TrophyOutlined />} color="success" className="animate-pulse" style={{ fontSize: '11px' }}>
                {t('debt.paidOff')}
              </Tag>
            )}
            <span className="font-semibold text-gray-900" style={{ fontSize: '13px' }}>{name}</span>
          </Space>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{t('table.current')}</span>,
      dataIndex: 'currentAmount',
      key: 'currentAmount',
      width: 120,
      render: (_, record: Debt) => {
        const { currentBalance } = calculateCurrentBalance(record);
        const actualCurrentBalance = record.currentAmount !== record.totalAmount
          ? record.currentAmount
          : currentBalance;
        return (
          <span className={`font-mono font-semibold ${actualCurrentBalance <= 0 ? 'text-green-600' : 'text-gray-900'}`} style={{ fontSize: '12px' }}>
            {formatCurrency(actualCurrentBalance)}
          </span>
        );
      },
      sorter: (a, b) => {
        const aBalance = calculateCurrentBalance(a).currentBalance;
        const bBalance = calculateCurrentBalance(b).currentBalance;
        return aBalance - bBalance;
      },
    },
    {
      title: <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{t('table.rate')}</span>,
      dataIndex: 'interestRate',
      key: 'interestRate',
      width: 70,
      render: (rate: number) => {
        const color = rate > 30 ? 'error' : rate > 15 ? 'warning' : 'default';
        return <Tag color={color} style={{ fontSize: '11px' }}>{rate.toFixed(1)}%</Tag>;
      },
      sorter: (a, b) => a.interestRate - b.interestRate,
    },
    {
      title: <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{t('table.payment')}</span>,
      dataIndex: 'monthlyPayment',
      key: 'monthlyPayment',
      width: 110,
      render: (payment: number) => (
        payment ? <span className="font-mono" style={{ fontSize: '12px' }}>{formatCurrency(payment)}</span> : '-'
      ),
      sorter: (a, b) => (a.monthlyPayment || 0) - (b.monthlyPayment || 0),
    },
    {
      title: <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{t('table.progress')}</span>,
      key: 'progress',
      width: 130,
      render: (_, record: Debt) => {
        const { currentBalance } = calculateCurrentBalance(record);
        const actualCurrentBalance = record.currentAmount !== record.totalAmount
          ? record.currentAmount
          : currentBalance;
        const progressPercent = record.totalAmount > 0
          ? ((record.totalAmount - actualCurrentBalance) / record.totalAmount) * 100
          : 0;
        return (
          <Progress
            percent={Math.round(progressPercent)}
            strokeColor={{
              '0%': '#4f46e5',
              '100%': '#10b981',
            }}
            strokeWidth={8}
            format={(percent) => `${percent}%`}
          />
        );
      },
      sorter: (a, b) => {
        const aProgress = (a.totalAmount - calculateCurrentBalance(a).currentBalance) / a.totalAmount;
        const bProgress = (b.totalAmount - calculateCurrentBalance(b).currentBalance) / b.totalAmount;
        return aProgress - bProgress;
      },
    },
    {
      title: <span style={{ fontSize: '12px' }}>{t('table.payoffDate')}</span>,
      key: 'payoffDate',
      width: 100,
      render: (_, record: Debt) => {
        const projection = calculateDebtProjection(record);
        if (projection.length === 0) return <Tag style={{ fontSize: '11px' }}>{t('overview.unknown')}</Tag>;
        if (isPaidOff(record)) return <Tag color="success" style={{ fontSize: '11px' }}>{t('overview.paid')}</Tag>;
        const lastPoint = projection[projection.length - 1];
        return <span className="text-gray-600" style={{ fontSize: '12px' }}>{format(lastPoint.date, 'MMM yy')}</span>;
      },
    },
    {
      title: <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{t('table.inTotal')}</span>,
      key: 'includeInTotal',
      width: 60,
      align: 'center',
      render: (_, record: Debt) => (
        <Checkbox
          checked={record.includeInTotal !== false}
          onChange={() => {
            const newValue = !(record.includeInTotal ?? true);
            onOptimisticUpdate([record.id], { includeInTotal: newValue });
            onSync('update', [record.id], { includeInTotal: newValue });
          }}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record: Debt) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onDebtEdit(record)}
            className="text-blue-500 hover:text-blue-700"
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'duplicate',
                  icon: <CopyOutlined />,
                  label: t('debt.duplicate'),
                  onClick: () => handleDuplicate(record),
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: t('common.delete'),
                  danger: true,
                  onClick: () => handleDelete([record.id]),
                },
              ],
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
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
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">{t('overview.currentDebt')}</div>
          <div className="text-3xl font-bold">{formatCurrency(totalCurrentDebt)}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">{t('overview.totalPaidOff')}</div>
          <div className="text-3xl font-bold">{formatCurrency(totalPaidOff)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">{t('overview.overallProgress')}</div>
          <div className="text-3xl font-bold">{totalProgressPercent.toFixed(1)}%</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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

      {/* Table */}
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredDebts}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `${t('common.total') || 'Total'}: ${total}`,
        }}
        scroll={{ x: 850 }}
        className="ant-table-custom shadow-sm rounded-xl overflow-hidden"
        rowClassName={(record) =>
          isPaidOff(record) ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
        }
      />
    </div>
  );
};

export default DebtListAntD;
