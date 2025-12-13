import { Debt, DebtProjection } from '../types';
import { addMonths } from 'date-fns';

export const calculateInterestRate = (
  loanAmount: number,
  monthlyPayment: number,
  durationMonths: number
): number => {
  // Using Newton-Raphson method to solve for interest rate
  // Monthly payment formula: P = L[r(1 + r)^n]/[(1 + r)^n - 1]
  // Where P = monthly payment, L = loan amount, r = monthly interest rate, n = number of payments
  
  let monthlyRate = 0.01; // Initial guess (1% per month)
  const tolerance = 1e-8;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    if (monthlyRate <= 0) monthlyRate = 0.001;
    
    const factor = Math.pow(1 + monthlyRate, durationMonths);
    const calculatedPayment = loanAmount * (monthlyRate * factor) / (factor - 1);
    
    if (Math.abs(calculatedPayment - monthlyPayment) < tolerance) {
      return monthlyRate * 12 * 100; // Convert monthly rate to annual percentage
    }
    
    // Derivative calculation for Newton-Raphson
    const numerator = monthlyRate * factor;
    const denominator = factor - 1;
    const dPdr = loanAmount * (
      (factor * (1 + monthlyRate * durationMonths)) / denominator -
      (numerator * factor * durationMonths) / (denominator * denominator)
    );
    
    if (Math.abs(dPdr) < 1e-12) break; // Avoid division by very small numbers
    
    monthlyRate = monthlyRate - (calculatedPayment - monthlyPayment) / dPdr;
    
    if (monthlyRate < 0) monthlyRate = 0.001; // Prevent negative rates
    if (monthlyRate > 1) monthlyRate = 0.5; // Cap at reasonable rate
  }
  
  return monthlyRate * 12 * 100; // Convert to annual percentage
};

export const calculateMonthlyPayment = (
  principal: number,
  annualInterestRate: number,
  durationMonths: number
): number => {
  // Input validation
  if (principal <= 0 || durationMonths <= 0) {
    return 0;
  }
  
  // Handle zero interest rate case
  if (annualInterestRate === 0) {
    return principal / durationMonths;
  }
  
  const monthlyRate = annualInterestRate / 100 / 12;
  
  // Handle very small interest rates
  if (monthlyRate < 1e-10) {
    return principal / durationMonths;
  }
  
  // Standard loan payment formula: P = L[r(1 + r)^n]/[(1 + r)^n - 1]
  const factor = Math.pow(1 + monthlyRate, durationMonths);
  
  // Prevent division by zero or very small numbers
  if (factor - 1 < 1e-10) {
    return principal / durationMonths;
  }
  
  const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
  
  // Return reasonable result, handle edge cases
  return isFinite(monthlyPayment) && monthlyPayment > 0 ? monthlyPayment : principal / durationMonths;
};

export const calculateCurrentBalance = (debt: Debt): { currentBalance: number; totalPaid: number; interestPaid: number; monthsElapsed: number } => {
  // Treat 1.2% as 0% interest (0-0-12 installment loans)
  const adjustedInterestRate = debt.interestRate === 1.2 ? 0 : debt.interestRate;
  const monthlyRate = adjustedInterestRate / 100 / 12;
  const today = new Date();
  const startDate = new Date(debt.dateStarted);
  
  // Calculate months elapsed since debt started
  const monthsElapsed = Math.max(0, 
    (today.getFullYear() - startDate.getFullYear()) * 12 + 
    (today.getMonth() - startDate.getMonth()) +
    (today.getDate() >= startDate.getDate() ? 0 : -1)
  );
  
  if (!debt.monthlyPayment || monthsElapsed <= 0) {
    return {
      currentBalance: debt.totalAmount,
      totalPaid: 0,
      interestPaid: 0,
      monthsElapsed: 0
    };
  }
  
  // Simulate all payments made since start date
  let remainingBalance = debt.totalAmount;
  let totalPaid = 0;
  let totalInterestPaid = 0;
  
  for (let i = 0; i < monthsElapsed && remainingBalance > 0.01; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = Math.min(debt.monthlyPayment - interestPayment, remainingBalance);
    
    if (principalPayment <= 0) break; // Payment too low to cover interest
    
    remainingBalance -= principalPayment;
    totalPaid += debt.monthlyPayment;
    totalInterestPaid += interestPayment;
  }
  
  return {
    currentBalance: Math.max(0, remainingBalance),
    totalPaid,
    interestPaid: totalInterestPaid,
    monthsElapsed
  };
};

export const calculateDebtProjection = (debt: Debt): DebtProjection[] => {
  const projections: DebtProjection[] = [];
  // Treat 1.2% as 0% interest (0-0-12 installment loans)
  const adjustedInterestRate = debt.interestRate === 1.2 ? 0 : debt.interestRate;
  const monthlyRate = adjustedInterestRate / 100 / 12;
  
  if (!debt.monthlyPayment) return projections;
  
  // Use manual override if available, otherwise calculated balance
  const { currentBalance } = calculateCurrentBalance(debt);
  const actualCurrentBalance = debt.currentAmount !== debt.totalAmount 
    ? debt.currentAmount 
    : currentBalance;
  let remainingBalance = actualCurrentBalance;
  let totalPaid = 0;
  let totalInterestPaid = 0;
  
  // Project future payments starting from today
  let currentDate = new Date();
  let monthCount = 0;
  
  while (remainingBalance > 0.01 && monthCount < 600) { // Cap at 50 years
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = Math.min(debt.monthlyPayment - interestPayment, remainingBalance);
    
    if (principalPayment <= 0) {
      // Payment too low to cover interest - debt will never be paid off
      break;
    }
    
    remainingBalance -= principalPayment;
    totalPaid += debt.monthlyPayment;
    totalInterestPaid += interestPayment;
    
    currentDate = addMonths(currentDate, 1);
    monthCount++;
    
    projections.push({
      month: monthCount,
      date: new Date(currentDate),
      remainingDebt: Math.max(0, remainingBalance),
      totalPaid,
      interestPaid: totalInterestPaid,
    });
    
    if (remainingBalance < 0.01) break; // Close enough to zero
  }
  
  return projections;
};

export const calculateCompleteDebtTimeline = (debts: Debt[], paymentStrategy?: PaymentStrategy | null, totalMonthlyBudget?: number, interestThreshold: number = 5): DebtProjection[] => {
  // Filter debts to include only those with includeInTotal = true
  const includedDebts = debts.filter(debt => debt.includeInTotal !== false);
  
  if (includedDebts.length === 0) return [];
  
  // Find the earliest start date among all debts
  const earliestStartDate = includedDebts.reduce((earliest, debt) => {
    const debtStart = new Date(debt.dateStarted);
    return debtStart < earliest ? debtStart : earliest;
  }, new Date(includedDebts[0].dateStarted));
  
  // Create timeline from earliest start date to final payoff
  const totalProjections: DebtProjection[] = [];
  
  // Track each debt's state over time
  const debtStates = includedDebts.map(debt => ({
    ...debt,
    remainingBalance: debt.totalAmount,
    totalPaid: 0,
    interestPaid: 0,
    startDate: new Date(debt.dateStarted),
    isActive: false // Will become active when we reach its start date
  }));
  
  let currentDate = new Date(earliestStartDate);
  let monthCount = 0;
  
  while (monthCount < 600) { // Cap at 50 years
    let totalRemaining = 0;
    let totalPaidSoFar = 0;
    let totalInterestSoFar = 0;
    
    // Get active debts with remaining balance
    const activeDebts = debtStates.filter(debt => {
      if (currentDate >= debt.startDate) {
        debt.isActive = true;
      }
      return debt.isActive && debt.remainingBalance > 0.01 && debt.monthlyPayment;
    });
    
    if (paymentStrategy && activeDebts.length > 0) {
      // Apply payment strategy for complete timeline
      const minimumPayments = activeDebts.reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0);
      const totalMonthlyPayment = totalMonthlyBudget && totalMonthlyBudget > minimumPayments
        ? totalMonthlyBudget
        : minimumPayments;

      // Sort based on strategy
      switch (paymentStrategy) {
        case 'snowball':
          activeDebts.sort((a, b) => a.remainingBalance - b.remainingBalance);
          break;
        case 'avalanche':
          activeDebts.sort((a, b) => b.interestRate - a.interestRate);
          break;
        case 'cashflow':
          activeDebts.sort((a, b) => (b.monthlyPayment || 0) - (a.monthlyPayment || 0));
          break;
        case 'smart':
          // Smart strategy for active debts
          const highInterestActive = activeDebts.filter(d => d.interestRate >= interestThreshold);
          const lowInterestActive = activeDebts.filter(d => d.interestRate < interestThreshold);

          highInterestActive.sort((a, b) => b.interestRate - a.interestRate);
          lowInterestActive.sort((a, b) => a.remainingBalance - b.remainingBalance);

          activeDebts.length = 0;
          activeDebts.push(...highInterestActive, ...lowInterestActive);
          break;
      }
      
      let monthlyPaymentLeft = totalMonthlyPayment;
      
      activeDebts.forEach((debtState, index) => {
        const adjustedInterestRate = debtState.interestRate === 1.2 ? 0 : debtState.interestRate;
        const monthlyRate = adjustedInterestRate / 100 / 12;
        const interestPayment = debtState.remainingBalance * monthlyRate;
        
        // For the focused debt (first one), use all available payment
        // For others, use minimum payment
        const availablePayment = index === 0 ? monthlyPaymentLeft : Math.min(debtState.monthlyPayment || 0, monthlyPaymentLeft);
        const principalPayment = Math.min(availablePayment - interestPayment, debtState.remainingBalance);
        
        if (principalPayment > 0) {
          debtState.remainingBalance -= principalPayment;
          debtState.totalPaid += (principalPayment + interestPayment);
          debtState.interestPaid += interestPayment;
          monthlyPaymentLeft -= (principalPayment + interestPayment);
          
          if (debtState.remainingBalance < 0.01) {
            debtState.remainingBalance = 0;
          }
        }
      });
    } else {
      // Standard payment strategy
      debtStates.forEach(debtState => {
        // Check if this debt has started yet
        if (currentDate >= debtState.startDate) {
          debtState.isActive = true;
        }
        
        // Only process active debts with remaining balance and monthly payment
        if (debtState.isActive && debtState.remainingBalance > 0.01 && debtState.monthlyPayment) {
          const adjustedInterestRate = debtState.interestRate === 1.2 ? 0 : debtState.interestRate;
          const monthlyRate = adjustedInterestRate / 100 / 12;
          const interestPayment = debtState.remainingBalance * monthlyRate;
          const principalPayment = Math.min(debtState.monthlyPayment - interestPayment, debtState.remainingBalance);
          
          if (principalPayment > 0) {
            debtState.remainingBalance -= principalPayment;
            debtState.totalPaid += debtState.monthlyPayment;
            debtState.interestPaid += interestPayment;
            
            if (debtState.remainingBalance < 0.01) {
              debtState.remainingBalance = 0;
            }
          }
        }
      });
    }
    
    // Calculate totals
    debtStates.forEach(debtState => {
      totalRemaining += debtState.remainingBalance;
      totalPaidSoFar += debtState.totalPaid;
      totalInterestSoFar += debtState.interestPaid;
    });
    
    const projectionDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    totalProjections.push({
      month: monthCount + 1,
      date: projectionDate,
      remainingDebt: totalRemaining,
      totalPaid: totalPaidSoFar,
      interestPaid: totalInterestSoFar,
    });
    
    // Stop if all debts are paid off
    if (totalRemaining <= 0.01) break;
    
    // Move to next month
    currentDate = addMonths(currentDate, 1);
    monthCount++;
  }
  
  return totalProjections;
};

export const calculateTotalDebtProjection = (debts: Debt[]): DebtProjection[] => {
  // Filter debts to include only those with includeInTotal = true (default to true if not set)
  const includedDebts = debts.filter(debt => debt.includeInTotal !== false);
  
  if (includedDebts.length === 0) return [];
  
  const maxMonths = Math.max(...includedDebts.map(debt => {
    const projection = calculateDebtProjection(debt);
    return projection.length;
  }));
  
  const totalProjections: DebtProjection[] = [];
  
  // Track the final total paid for each debt to avoid decreasing totals
  const debtFinalTotals = new Map<string, { totalPaid: number; interestPaid: number }>();
  
  for (let month = 1; month <= maxMonths; month++) {
    let totalRemaining = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    
    includedDebts.forEach(debt => {
      const projection = calculateDebtProjection(debt);
      const monthData = projection[month - 1];
      
      if (monthData) {
        // Debt is still active
        totalRemaining += monthData.remainingDebt;
        totalPaid += monthData.totalPaid;
        totalInterest += monthData.interestPaid;
        
        // Update the final totals for this debt
        debtFinalTotals.set(debt.id, {
          totalPaid: monthData.totalPaid,
          interestPaid: monthData.interestPaid
        });
      } else {
        // Debt is paid off, use the final totals
        const finalTotals = debtFinalTotals.get(debt.id);
        if (finalTotals) {
          totalPaid += finalTotals.totalPaid;
          totalInterest += finalTotals.interestPaid;
        }
        // totalRemaining += 0 (debt is paid off)
      }
    });
    
    totalProjections.push({
      month,
      date: addMonths(new Date(), month - 1),
      remainingDebt: totalRemaining,
      totalPaid,
      interestPaid: totalInterest,
    });
    
    if (totalRemaining === 0) break;
  }
  
  return totalProjections;
};

export type PaymentStrategy = 'snowball' | 'avalanche' | 'cashflow' | 'smart';


export const calculateSnowballProjection = (debts: Debt[], totalMonthlyBudget?: number, strategy: PaymentStrategy = 'snowball', interestThreshold: number = 5): DebtProjection[] => {
  // Filter debts to include only those with includeInTotal = true and have monthly payments
  const includedDebts = debts.filter(debt =>
    debt.includeInTotal !== false && debt.monthlyPayment && debt.monthlyPayment > 0
  );

  if (includedDebts.length === 0) return [];

  // Calculate current balances for all debts
  const debtBalances = includedDebts.map(debt => ({
    ...debt,
    currentBalance: calculateCurrentBalance(debt).currentBalance
  })).filter(debt => debt.currentBalance > 0.01); // Only debts with remaining balance

  if (debtBalances.length === 0) return [];

  // Sort based on strategy
  switch (strategy) {
    case 'snowball':
      // Sort by balance (smallest first)
      debtBalances.sort((a, b) => a.currentBalance - b.currentBalance);
      break;
    case 'avalanche':
      // Sort by interest rate (highest first)
      debtBalances.sort((a, b) => b.interestRate - a.interestRate);
      break;
    case 'cashflow':
      // Sort by monthly payment (highest first)
      debtBalances.sort((a, b) => (b.monthlyPayment || 0) - (a.monthlyPayment || 0));
      break;
    case 'smart':
      // Smart strategy: High interest first, but only above threshold
      // First separate into high and low interest groups
      const highInterest = debtBalances.filter(d => d.interestRate >= interestThreshold);
      const lowInterest = debtBalances.filter(d => d.interestRate < interestThreshold);

      // Sort high interest by rate (highest first)
      highInterest.sort((a, b) => b.interestRate - a.interestRate);
      // Sort low interest by balance (smallest first)
      lowInterest.sort((a, b) => a.currentBalance - b.currentBalance);

      // Combine: attack high interest first, then low interest
      debtBalances.length = 0;
      debtBalances.push(...highInterest, ...lowInterest);
      break;
  }
  
  const minimumPayments = debtBalances.reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0);
  const totalMonthlyPayment = totalMonthlyBudget && totalMonthlyBudget > minimumPayments 
    ? totalMonthlyBudget 
    : minimumPayments;
  const projections: DebtProjection[] = [];
  
  let month = 1;
  let remainingDebts = [...debtBalances];
  let totalPaidSoFar = 0;
  let totalInterestPaidSoFar = 0;
  
  while (remainingDebts.length > 0 && month <= 600) { // Cap at 50 years
    let monthlyPaymentLeft = totalMonthlyPayment;
    let totalRemainingThisMonth = 0;
    let totalPaidThisMonth = 0;
    let totalInterestThisMonth = 0;
    
    // Process debts in order (smallest balance first)
    for (let i = 0; i < remainingDebts.length; i++) {
      const debt = remainingDebts[i];
      const monthlyRate = debt.interestRate / 100 / 12;
      const interestPayment = debt.currentBalance * monthlyRate;
      
      // For the focused debt (first one), use all available payment
      // For others, use minimum payment
      const availablePayment = i === 0 ? monthlyPaymentLeft : Math.min(debt.monthlyPayment || 0, monthlyPaymentLeft);
      const principalPayment = Math.min(availablePayment - interestPayment, debt.currentBalance);
      
      if (principalPayment <= 0) {
        // Can't make progress on this debt
        totalRemainingThisMonth += debt.currentBalance;
        continue;
      }
      
      debt.currentBalance -= principalPayment;
      monthlyPaymentLeft -= (principalPayment + interestPayment);
      totalPaidThisMonth += (principalPayment + interestPayment);
      totalInterestThisMonth += interestPayment;
      
      if (debt.currentBalance <= 0.01) {
        // Debt is paid off, remove from list
        debt.currentBalance = 0;
      }
      
      totalRemainingThisMonth += debt.currentBalance;
    }
    
    // Remove paid off debts
    remainingDebts = remainingDebts.filter(debt => debt.currentBalance > 0.01);
    
    totalPaidSoFar += totalPaidThisMonth;
    totalInterestPaidSoFar += totalInterestThisMonth;
    
    projections.push({
      month,
      date: addMonths(new Date(), month - 1),
      remainingDebt: totalRemainingThisMonth,
      totalPaid: totalPaidSoFar,
      interestPaid: totalInterestPaidSoFar,
    });
    
    month++;
  }
  
  return projections;
};