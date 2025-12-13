export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentAmount: number;
  interestRate: number;
  dateStarted: Date;
  monthlyPayment?: number;
  duration?: number; // in months
  includeInTotal?: boolean; // whether to include in total calculations
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'yearly';
  includeInTotal?: boolean; // whether to include in total calculations
}

export interface DebtProjection {
  month: number;
  date: Date;
  remainingDebt: number;
  totalPaid: number;
  interestPaid: number;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'yearly';
  category?: string;
  includeInTotal?: boolean;
}

export interface AppState {
  debts: Debt[];
  incomeSources: IncomeSource[];
  recurringExpenses?: RecurringExpense[];
}