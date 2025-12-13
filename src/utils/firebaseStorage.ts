import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppState, Debt, IncomeSource, RecurringExpense } from '../types';
import { loadFromStorage, saveToStorage } from './storage';

// Get user's Firestore collections
const getUserDebtsCollection = (userId: string) => 
  collection(db, 'users', userId, 'debts');

const getUserIncomesCollection = (userId: string) =>
  collection(db, 'users', userId, 'incomes');

const getUserExpensesCollection = (userId: string) =>
  collection(db, 'users', userId, 'expenses');

// Load data from Firestore
export const loadFromFirestore = async (userId: string): Promise<AppState> => {
  try {
    // Load debts
    const debtsQuery = query(getUserDebtsCollection(userId), orderBy('dateStarted', 'desc'));
    const debtsSnapshot = await getDocs(debtsQuery);
    const debts = debtsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      dateStarted: doc.data().dateStarted.toDate(), // Convert Firestore Timestamp to Date
    })) as Debt[];

    // Load incomes
    const incomesQuery = query(getUserIncomesCollection(userId));
    const incomesSnapshot = await getDocs(incomesQuery);
    const incomeSources = incomesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as IncomeSource[];

    // Load expenses
    const expensesQuery = query(getUserExpensesCollection(userId));
    const expensesSnapshot = await getDocs(expensesQuery);
    const recurringExpenses = expensesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as RecurringExpense[];

    return {
      debts,
      incomeSources,
      recurringExpenses,
    };
  } catch (error) {
    console.error('Error loading from Firestore:', error);
    throw error;
  }
};

// Save data to Firestore
export const saveToFirestore = async (userId: string, state: AppState): Promise<void> => {
  try {
    const batch = [];

    // Save debts
    for (const debt of state.debts) {
      const debtRef = doc(getUserDebtsCollection(userId), debt.id);
      batch.push(setDoc(debtRef, debt));
    }

    // Save incomes
    for (const income of state.incomeSources) {
      const incomeRef = doc(getUserIncomesCollection(userId), income.id);
      batch.push(setDoc(incomeRef, income));
    }

    // Save expenses
    if (state.recurringExpenses) {
      for (const expense of state.recurringExpenses) {
        const expenseRef = doc(getUserExpensesCollection(userId), expense.id);
        batch.push(setDoc(expenseRef, expense));
      }
    }

    await Promise.all(batch);
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
};

// Migrate localStorage data to Firestore on first login
export const migrateLocalStorageToFirestore = async (userId: string): Promise<boolean> => {
  try {
    // Check if user already has data in Firestore
    const debtsSnapshot = await getDocs(getUserDebtsCollection(userId));
    
    if (!debtsSnapshot.empty) {
      // User already has cloud data, no migration needed
      return false;
    }

    // Load existing localStorage data
    const localData = loadFromStorage();
    
    if (localData.debts.length === 0 && localData.incomeSources.length === 0 && (!localData.recurringExpenses || localData.recurringExpenses.length === 0)) {
      // No local data to migrate
      return false;
    }

    // Migrate to Firestore
    await saveToFirestore(userId, localData);
    
    console.log('Successfully migrated localStorage data to Firestore');
    return true;
  } catch (error) {
    console.error('Error migrating data:', error);
    throw error;
  }
};

// Individual CRUD operations for debts
export const addDebtToFirestore = async (userId: string, debt: Debt): Promise<void> => {
  try {
    const debtRef = doc(getUserDebtsCollection(userId), debt.id);
    await setDoc(debtRef, debt);
  } catch (error) {
    console.error('Error adding debt to Firestore:', error);
    throw error;
  }
};

export const updateDebtInFirestore = async (userId: string, debt: Debt): Promise<void> => {
  try {
    const debtRef = doc(getUserDebtsCollection(userId), debt.id);
    await updateDoc(debtRef, debt as any);
  } catch (error) {
    console.error('Error updating debt in Firestore:', error);
    throw error;
  }
};

export const deleteDebtFromFirestore = async (userId: string, debtId: string): Promise<void> => {
  try {
    const debtRef = doc(getUserDebtsCollection(userId), debtId);
    await deleteDoc(debtRef);
  } catch (error) {
    console.error('Error deleting debt from Firestore:', error);
    throw error;
  }
};

// Individual CRUD operations for incomes
export const addIncomeToFirestore = async (userId: string, income: IncomeSource): Promise<void> => {
  try {
    const incomeRef = doc(getUserIncomesCollection(userId), income.id);
    await setDoc(incomeRef, income);
  } catch (error) {
    console.error('Error adding income to Firestore:', error);
    throw error;
  }
};

export const updateIncomeInFirestore = async (userId: string, income: IncomeSource): Promise<void> => {
  try {
    const incomeRef = doc(getUserIncomesCollection(userId), income.id);
    await updateDoc(incomeRef, income as any);
  } catch (error) {
    console.error('Error updating income in Firestore:', error);
    throw error;
  }
};

export const deleteIncomeFromFirestore = async (userId: string, incomeId: string): Promise<void> => {
  try {
    const incomeRef = doc(getUserIncomesCollection(userId), incomeId);
    await deleteDoc(incomeRef);
  } catch (error) {
    console.error('Error deleting income from Firestore:', error);
    throw error;
  }
};

// Individual CRUD operations for expenses
export const addExpenseToFirestore = async (userId: string, expense: RecurringExpense): Promise<void> => {
  try {
    const expenseRef = doc(getUserExpensesCollection(userId), expense.id);
    await setDoc(expenseRef, expense);
  } catch (error) {
    console.error('Error adding expense to Firestore:', error);
    throw error;
  }
};

export const updateExpenseInFirestore = async (userId: string, expense: RecurringExpense): Promise<void> => {
  try {
    const expenseRef = doc(getUserExpensesCollection(userId), expense.id);
    await updateDoc(expenseRef, expense as any);
  } catch (error) {
    console.error('Error updating expense in Firestore:', error);
    throw error;
  }
};

export const deleteExpenseFromFirestore = async (userId: string, expenseId: string): Promise<void> => {
  try {
    const expenseRef = doc(getUserExpensesCollection(userId), expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Error deleting expense from Firestore:', error);
    throw error;
  }
};