import React from 'react';
import { useTranslation } from 'react-i18next';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onMarkPaid: () => void;
  onToggleInclude: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onDelete,
  onMarkPaid,
  onToggleInclude,
  onExport,
  onClearSelection
}) => {
  const { t } = useTranslation();

  return (
    <div className="bulk-actions-toolbar">
      <span className="selected-count">
        {t('debt.selectedCount', { count: selectedCount })}
      </span>
      <button className="bulk-action-btn" onClick={onMarkPaid}>
        {t('debt.markAsPaid')}
      </button>
      <button className="bulk-action-btn" onClick={onToggleInclude}>
        {t('debt.toggleInclude')}
      </button>
      <button className="bulk-action-btn export" onClick={onExport}>
        {t('debt.export')}
      </button>
      <button className="bulk-action-btn delete" onClick={onDelete}>
        {t('common.delete')}
      </button>
      <button className="bulk-action-btn clear" onClick={onClearSelection}>
        {t('common.clear')}
      </button>
    </div>
  );
};

export default BulkActionsToolbar;
