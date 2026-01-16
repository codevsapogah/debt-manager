import React from 'react';
import { useTranslation } from 'react-i18next';

export const PaidOffBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="paid-off-badge">
      <span className="badge-icon">🎉</span>
      <span className="badge-text">{t('debt.paidOff')}</span>
    </div>
  );
};

export default PaidOffBadge;
