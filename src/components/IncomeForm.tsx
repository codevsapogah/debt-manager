import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { IncomeSource } from '../types';
import { addIncomeSource, updateIncomeSource } from '../utils/storage';

interface IncomeFormProps {
  onIncomeAdded: () => void;
  editingIncome?: IncomeSource | null;
  onEditComplete?: () => void;
}

const IncomeForm: React.FC<IncomeFormProps> = ({ onIncomeAdded, editingIncome, onEditComplete }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'weekly' | 'biweekly' | 'yearly'
  });

  useEffect(() => {
    if (editingIncome) {
      setFormData({
        name: editingIncome.name,
        amount: editingIncome.amount.toString(),
        frequency: editingIncome.frequency,
      });
    } else {
      setFormData({
        name: '',
        amount: '',
        frequency: 'monthly'
      });
    }
  }, [editingIncome]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.amount || parseFloat(formData.amount) <= 0) {
      return;
    }

    try {
      if (editingIncome) {
        const updatedIncome: IncomeSource = {
          ...editingIncome,
          name: formData.name.trim(),
          amount: parseFloat(formData.amount),
          frequency: formData.frequency,
        };

        await updateIncomeSource(updatedIncome);

        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        const income: IncomeSource = {
          id: uuidv4(),
          name: formData.name.trim(),
          amount: parseFloat(formData.amount),
          frequency: formData.frequency,
        };

        await addIncomeSource(income);

        setFormData({
          name: '',
          amount: '',
          frequency: 'monthly'
        });
      }

      onIncomeAdded();
    } catch (error) {
      console.error('Failed to save income:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly'
    });
    if (onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <div className="income-form-container">
      <div className="income-form">
        <h3 className="form-title">
          {editingIncome ? t('income.editIncome') : t('income.addIncome')}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="income-name" className="form-label">
              {t('income.sourceName')}
            </label>
            <input
              type="text"
              id="income-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder={t('income.placeholder')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="income-amount" className="form-label">
              {t('income.amount')} (₸)
            </label>
            <input
              type="text"
              id="income-amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="form-input"
              placeholder="0"
              pattern="[0-9]*\.?[0-9]+"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="income-frequency" className="form-label">
              {t('income.frequency')}
            </label>
            <select
              id="income-frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="weekly">{t('income.frequencies.weekly')}</option>
              <option value="biweekly">{t('income.frequencies.biweekly')}</option>
              <option value="monthly">{t('income.frequencies.monthly')}</option>
              <option value="yearly">{t('income.frequencies.yearly')}</option>
            </select>
          </div>

          <div className={`form-actions ${editingIncome ? 'two-buttons' : 'one-button'}`}>
            <button type="submit" className="btn btn-primary">
              {editingIncome ? t('common.save') : t('income.addIncomeButton')}
            </button>
            {editingIncome && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncomeForm;
