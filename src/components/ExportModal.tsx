import React from 'react';
import { useTranslation } from 'react-i18next';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'json') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('debt.exportData')}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>{t('debt.selectExportFormat')}</p>
          <div className="export-format-buttons">
            <button
              className="export-format-btn"
              onClick={() => {
                onExport('csv');
                onClose();
              }}
            >
              CSV
            </button>
            <button
              className="export-format-btn"
              onClick={() => {
                onExport('json');
                onClose();
              }}
            >
              JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
