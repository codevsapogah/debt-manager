import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Debt } from '../types';
import { addDebt, updateDebt } from '../utils/storage';
import { calculateInterestRate, calculateMonthlyPayment } from '../utils/calculations';

interface DebtFormProps {
  onDebtAdded: () => void;
  editingDebt?: Debt | null;
  onEditComplete?: () => void;
}

const DebtForm: React.FC<DebtFormProps> = ({ onDebtAdded, editingDebt, onEditComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: '',
    currentAmount: '',
    interestRate: '',
    dateStarted: new Date().toISOString().split('T')[0],
    monthlyPayment: '',
    duration: '',
    calculationMode: 'manual' as 'manual' | 'calculate-rate' | 'calculate-payment',
    includeInTotal: true
  });

  const [calculationResult, setCalculationResult] = useState<string | null>(null);

  // Load editing debt data when editingDebt changes
  useEffect(() => {
    if (editingDebt) {
      setFormData({
        name: editingDebt.name,
        totalAmount: editingDebt.totalAmount.toString(),
        currentAmount: editingDebt.currentAmount.toString(),
        interestRate: editingDebt.interestRate.toString(),
        dateStarted: editingDebt.dateStarted.toISOString().split('T')[0],
        monthlyPayment: editingDebt.monthlyPayment?.toString() || '',
        duration: editingDebt.duration?.toString() || '',
        calculationMode: 'manual',
        includeInTotal: editingDebt.includeInTotal !== false
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: '',
        totalAmount: '',
        currentAmount: '',
        interestRate: '',
        dateStarted: new Date().toISOString().split('T')[0],
        monthlyPayment: '',
        duration: '',
        calculationMode: 'manual',
        includeInTotal: true
      });
    }
  }, [editingDebt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const calculateMissingValue = () => {
    const amount = parseFloat(formData.totalAmount);
    const payment = parseFloat(formData.monthlyPayment);
    const duration = parseInt(formData.duration);
    const rate = parseFloat(formData.interestRate);

    if (formData.calculationMode === 'calculate-rate' && amount && payment && duration) {
      const calculatedRate = calculateInterestRate(amount, payment, duration);
      setFormData(prev => ({ ...prev, interestRate: calculatedRate.toFixed(2) }));
      setCalculationResult(`✅ Calculated Interest Rate: ${calculatedRate.toFixed(2)}%`);
    } else if (formData.calculationMode === 'calculate-payment' && amount && !isNaN(rate) && duration) {
      const calculatedPayment = calculateMonthlyPayment(amount, rate, duration);
      setFormData(prev => ({ ...prev, monthlyPayment: calculatedPayment.toFixed(2) }));
      setCalculationResult(`✅ Calculated Monthly Payment: ₸${calculatedPayment.toFixed(2)}`);
    }
    
    // Clear the result after 5 seconds
    setTimeout(() => setCalculationResult(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDebt) {
      // Update existing debt
      const updatedDebt: Debt = {
        ...editingDebt,
        name: formData.name,
        totalAmount: parseFloat(formData.totalAmount),
        currentAmount: parseFloat(formData.currentAmount),
        interestRate: parseFloat(formData.interestRate),
        dateStarted: new Date(formData.dateStarted),
        monthlyPayment: formData.monthlyPayment ? parseFloat(formData.monthlyPayment) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        includeInTotal: formData.includeInTotal,
      };

        await updateDebt(editingDebt.id, updatedDebt);
        onEditComplete?.();
      } else {
      // Add new debt
      const debt: Debt = {
        id: uuidv4(),
        name: formData.name,
        totalAmount: parseFloat(formData.totalAmount),
        currentAmount: parseFloat(formData.totalAmount),
        interestRate: parseFloat(formData.interestRate),
        dateStarted: new Date(formData.dateStarted),
        monthlyPayment: formData.monthlyPayment ? parseFloat(formData.monthlyPayment) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        includeInTotal: formData.includeInTotal,
      };

        await addDebt(debt);
      }

      onDebtAdded();
    } catch (error) {
      console.error('Failed to save debt:', error);
    }
  };

  return (
    <div className="debt-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Debt Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="e.g., Credit Card, Car Loan"
          />
        </div>

        <div className="form-group">
          <label htmlFor="totalAmount">Total Debt Amount (₸):</label>
          <input
            type="number"
            id="totalAmount"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleInputChange}
            required
            step="0.01"
            min="0"
          />
        </div>

        {editingDebt && (
          <div className="form-group">
            <label htmlFor="currentAmount">Current Balance (₸):</label>
            <input
              type="number"
              id="currentAmount"
              name="currentAmount"
              value={formData.currentAmount}
              onChange={handleInputChange}
              required
              step="0.01"
              min="0"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="dateStarted">Date Started:</label>
          <input
            type="date"
            id="dateStarted"
            name="dateStarted"
            value={formData.dateStarted}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="calculationMode">Calculation Mode:</label>
          <select
            id="calculationMode"
            name="calculationMode"
            value={formData.calculationMode}
            onChange={handleInputChange}
          >
            <option value="manual">Enter all values manually</option>
            <option value="calculate-rate">Calculate interest rate</option>
            <option value="calculate-payment">Calculate monthly payment</option>
          </select>
        </div>

        {formData.calculationMode !== 'calculate-rate' && (
          <div className="form-group">
            <label htmlFor="interestRate">Annual Interest Rate (%):</label>
            <input
              type="number"
              id="interestRate"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleInputChange}
              required={formData.calculationMode === 'manual'}
              step="0.01"
              min="0"
              max="100"
            />
          </div>
        )}

        {formData.calculationMode !== 'calculate-payment' && (
          <div className="form-group">
            <label htmlFor="monthlyPayment">Monthly Payment (₸):</label>
            <input
              type="number"
              id="monthlyPayment"
              name="monthlyPayment"
              value={formData.monthlyPayment}
              onChange={handleInputChange}
              step="0.01"
              min="0"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="duration">Duration (months):</label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            min="1"
            max="600"
          />
        </div>

        {formData.calculationMode !== 'manual' && (
          <>
            <button type="button" onClick={calculateMissingValue}>
              {formData.calculationMode === 'calculate-rate' 
                ? 'Calculate Interest Rate' 
                : 'Calculate Monthly Payment'
              }
            </button>
            
            {calculationResult && (
              <div className="calculation-result">
                {calculationResult}
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="includeInTotal"
              checked={formData.includeInTotal}
              onChange={handleInputChange}
              style={{ marginRight: '8px' }}
            />
            Include in total calculations
          </label>
        </div>

        <button type="submit">{editingDebt ? 'Update Debt' : 'Add Debt'}</button>
        
        {editingDebt && (
          <button type="button" onClick={onEditComplete} style={{ marginLeft: '10px', background: '#6b7280' }}>
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

export default DebtForm;
