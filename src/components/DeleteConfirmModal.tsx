import React from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  dontAskAgain: boolean;
  onDontAskAgainChange: (value: boolean) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  dontAskAgain,
  onDontAskAgainChange
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('debt.confirmDelete')}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>
            {count === 1
              ? t('debt.confirmDeleteSingle')
              : t('debt.confirmDeleteMultiple', { count })}
          </p>
          <label className="dont-ask-checkbox">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => onDontAskAgainChange(e.target.checked)}
            />
            {t('debt.dontAskAgain')}
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
