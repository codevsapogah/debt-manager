import { Debt } from '../types';

export const exportToCSV = (debts: Debt[]): void => {
  const headers = ['Name', 'Total Amount', 'Current Amount', 'Interest Rate', 'Monthly Payment', 'Date Started', 'Include in Total'];
  const rows = debts.map(debt => [
    debt.name,
    debt.totalAmount,
    debt.currentAmount,
    debt.interestRate,
    debt.monthlyPayment || '',
    new Date(debt.dateStarted).toLocaleDateString(),
    debt.includeInTotal ? 'Yes' : 'No'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadFile(csvContent, 'debts.csv', 'text/csv');
};

export const exportToJSON = (debts: Debt[]): void => {
  const jsonContent = JSON.stringify(debts, null, 2);
  downloadFile(jsonContent, 'debts.json', 'application/json');
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
