import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { RecurringExpense } from '../types';
import { addRecurringExpense, updateRecurringExpense } from '../utils/storage';

interface ExpenseFormProps {
  onExpenseAdded: () => void;
  editingExpense: RecurringExpense | null;
  onEditComplete: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onExpenseAdded,
  editingExpense,
  onEditComplete
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'weekly' | 'biweekly' | 'yearly',
    category: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        name: editingExpense.name,
        amount: editingExpense.amount.toString(),
        frequency: editingExpense.frequency,
        category: editingExpense.category || ''
      });
    } else {
      setFormData({
        name: '',
        amount: '',
        frequency: 'monthly',
        category: ''
      });
    }
    setErrors({});
  }, [editingExpense]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t('validation.required');
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = t('validation.amountRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const expense: RecurringExpense = {
      id: editingExpense?.id || uuidv4(),
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      category: formData.category.trim() || undefined,
      includeInTotal: true
    };

    if (editingExpense) {
      await updateRecurringExpense(expense);
      onEditComplete();
    } else {
      await addRecurringExpense(expense);
    }

    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      category: ''
    });
    setErrors({});
    onExpenseAdded();
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      category: ''
    });
    setErrors({});
    onEditComplete();
  };

  return (
    <div className="expense-form-container">
      <form className="expense-form" onSubmit={handleSubmit}>
        <h3>{editingExpense ? t('expense.editExpense') : t('expense.addExpense')}</h3>

        <div className="form-group">
          <label htmlFor="expense-name">{t('expense.name')}</label>
          <input
            type="text"
            id="expense-name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder={t('expense.namePlaceholder')}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expense-amount">{t('expense.amount')}</label>
            <input
              type="text"
              id="expense-amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className={`form-input ${errors.amount ? 'error' : ''}`}
              placeholder="0"
              pattern="[0-9]*\.?[0-9]+"
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="expense-frequency">{t('expense.frequency')}</label>
            <select
              id="expense-frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="monthly">{t('expense.frequencies.monthly')}</option>
              <option value="weekly">{t('expense.frequencies.weekly')}</option>
              <option value="biweekly">{t('expense.frequencies.biweekly')}</option>
              <option value="yearly">{t('expense.frequencies.yearly')}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="expense-category">{t('expense.category')}</label>
          <input
            type="text"
            id="expense-category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="form-input"
            placeholder={t('expense.categoryPlaceholder')}
          />
        </div>

        <div className={`form-actions ${editingExpense ? 'two-buttons' : 'one-button'}`}>
          <button type="submit" className="btn btn-primary">
            {editingExpense ? t('common.save') : t('expense.addExpenseButton')}
          </button>
          {editingExpense && (
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              {t('common.cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;