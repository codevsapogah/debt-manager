import { Debt, Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addTransaction, updateDebt } from './storage';

export async function processAutoLogPayments(
  debts: Debt[],
  userId?: string
): Promise<{ newTransactions: Transaction[]; updatedDebts: Debt[] }> {
  const today = new Date();
  const newTransactions: Transaction[] = [];
  const updatedDebts: Debt[] = [];

  for (const debt of debts) {
    if (!debt.autoLog || !debt.autoLogDay || debt.currentAmount <= 0) continue;

    const amount = debt.autoLogAmount || debt.monthlyPayment || 0;
    if (amount <= 0) continue;

    const lastLog = debt.lastAutoLogDate ? new Date(debt.lastAutoLogDate) : null;
    const paymentDate = new Date(today.getFullYear(), today.getMonth(), debt.autoLogDay);

    // If payment day hasn't passed this month yet, skip
    if (paymentDate > today) continue;

    // If we already logged for this month, skip
    if (
      lastLog &&
      lastLog.getMonth() === today.getMonth() &&
      lastLog.getFullYear() === today.getFullYear()
    )
      continue;

    const balanceAfter = Math.max(0, debt.currentAmount - amount);
    const tx: Transaction = {
      id: uuidv4(),
      debtId: debt.id,
      amount,
      date: paymentDate,
      type: 'recurring',
      balanceAfter,
    };

    await addTransaction(tx, userId);
    newTransactions.push(tx);

    const updatedDebt: Debt = {
      ...debt,
      currentAmount: balanceAfter,
      lastAutoLogDate: paymentDate,
    };

    await updateDebt(updatedDebt.id, updatedDebt);
    updatedDebts.push(updatedDebt);
  }

  return { newTransactions, updatedDebts };
}
