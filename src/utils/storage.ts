import { AppState, Debt, IncomeSource, RecurringExpense } from '../types';
import { auth } from '../config/firebase';
import {
  addDebtToFirestore,
  updateDebtInFirestore,
  deleteDebtFromFirestore,
  addIncomeToFirestore,
  updateIncomeInFirestore,
  deleteIncomeFromFirestore,
  addExpenseToFirestore,
  updateExpenseInFirestore,
  deleteExpenseFromFirestore,
} from './firebaseStorage';

const STORAGE_KEY = 'debt-manager-data';

export const loadFromStorage = (): AppState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        debts: parsed.debts.map((debt: any) => ({
          ...debt,
          dateStarted: new Date(debt.dateStarted),
        })),
        incomeSources: parsed.incomeSources || [],
        recurringExpenses: parsed.recurringExpenses || [],
      };
    }
  } catch (error) {
    console.error('Error loading from storage:', error);
  }

  return {
    debts: [],
    incomeSources: [],
    recurringExpenses: [],
  };
};

export const saveToStorage = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const addDebt = async (debt: Debt): Promise<void> => {
  const currentState = loadFromStorage();
  currentState.debts.push(debt);
  saveToStorage(currentState);
  if (auth.currentUser) {
    try {
      await addDebtToFirestore(auth.currentUser.uid, debt);
    } catch (error) {
      console.error('Failed to sync debt to Firebase:', error);
    }
  }
};

export const updateDebt = async (debtId: string, updatedDebt: Debt): Promise<void> => {
  const currentState = loadFromStorage();
  const index = currentState.debts.findIndex(d => d.id === debtId);
  if (index !== -1) {
    currentState.debts[index] = updatedDebt;
    saveToStorage(currentState);
    if (auth.currentUser) {
      try {
        await updateDebtInFirestore(auth.currentUser.uid, updatedDebt);
      } catch (error) {
        console.error('Failed to sync debt update to Firebase:', error);
      }
    }
  }
};

export const deleteDebt = async (debtId: string): Promise<void> => {
  const currentState = loadFromStorage();
  currentState.debts = currentState.debts.filter(d => d.id !== debtId);
  saveToStorage(currentState);
  if (auth.currentUser) {
    try {
      await deleteDebtFromFirestore(auth.currentUser.uid, debtId);
    } catch (error) {
      console.error('Failed to sync debt deletion to Firebase:', error);
    }
  }
};

export const addIncomeSource = async (income: IncomeSource): Promise<void> => {
  const currentState = loadFromStorage();
  currentState.incomeSources.push(income);
  saveToStorage(currentState);
  if (auth.currentUser) {
    try {
      await addIncomeToFirestore(auth.currentUser.uid, income);
    } catch (error) {
      console.error('Failed to sync income to Firebase:', error);
    }
  }
};

export const updateIncomeSource = async (updatedIncome: IncomeSource): Promise<void> => {
  const currentState = loadFromStorage();
  const index = currentState.incomeSources.findIndex(i => i.id === updatedIncome.id);
  if (index !== -1) {
    currentState.incomeSources[index] = updatedIncome;
    saveToStorage(currentState);
    if (auth.currentUser) {
      try {
        await updateIncomeInFirestore(auth.currentUser.uid, updatedIncome);
      } catch (error) {
        console.error('Failed to sync income update to Firebase:', error);
      }
    }
  }
};

export const deleteIncomeSource = async (incomeId: string): Promise<void> => {
  const currentState = loadFromStorage();
  currentState.incomeSources = currentState.incomeSources.filter(i => i.id !== incomeId);
  saveToStorage(currentState);
  if (auth.currentUser) {
    try {
      await deleteIncomeFromFirestore(auth.currentUser.uid, incomeId);
    } catch (error) {
      console.error('Failed to sync income deletion to Firebase:', error);
    }
  }
};

export const addRecurringExpense = async (expense: RecurringExpense): Promise<void> => {
  const currentState = loadFromStorage();
  if (!currentState.recurringExpenses) {
    currentState.recurringExpenses = [];
  }
  currentState.recurringExpenses.push(expense);
  saveToStorage(currentState);

  // Sync to Firebase if user is logged in
  if (auth.currentUser) {
    try {
      await addExpenseToFirestore(auth.currentUser.uid, expense);
    } catch (error) {
      console.error('Failed to sync expense to Firebase:', error);
    }
  }
};

export const updateRecurringExpense = async (updatedExpense: RecurringExpense): Promise<void> => {
  const currentState = loadFromStorage();
  if (!currentState.recurringExpenses) {
    currentState.recurringExpenses = [];
  }
  const index = currentState.recurringExpenses.findIndex(e => e.id === updatedExpense.id);
  if (index !== -1) {
    currentState.recurringExpenses[index] = updatedExpense;
    saveToStorage(currentState);

    // Sync to Firebase if user is logged in
    if (auth.currentUser) {
      try {
        await updateExpenseInFirestore(auth.currentUser.uid, updatedExpense);
      } catch (error) {
        console.error('Failed to sync expense update to Firebase:', error);
      }
    }
  }
};

export const deleteRecurringExpense = async (expenseId: string): Promise<void> => {
  const currentState = loadFromStorage();
  if (currentState.recurringExpenses) {
    currentState.recurringExpenses = currentState.recurringExpenses.filter(e => e.id !== expenseId);
    saveToStorage(currentState);

    // Sync to Firebase if user is logged in
    if (auth.currentUser) {
      try {
        await deleteExpenseFromFirestore(auth.currentUser.uid, expenseId);
      } catch (error) {
        console.error('Failed to sync expense deletion to Firebase:', error);
      }
    }
  }
};
