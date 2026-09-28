export interface Category {
  name: string;
  color: string;
  icon: string;
}

export const CATS: Category[] = [
  { name: 'Housing', color: '#1b3a6b', icon: '🏠' },
  { name: 'Food', color: '#2980b9', icon: '🍔' },
  { name: 'Transport', color: '#16a085', icon: '🚗' },
  { name: 'Health', color: '#8e44ad', icon: '💊' },
  { name: 'Entertainment', color: '#e67e22', icon: '🎬' },
  { name: 'Clothing', color: '#c0392b', icon: '👗' },
  { name: 'Savings', color: '#27ae60', icon: '💰' },
  { name: 'Other', color: '#7f8c8d', icon: '📦' },
];

const FALLBACK_CAT: Category = { name: 'Other', color: '#94a3b8', icon: '📦' };

export function catInfo(name: string): Category {
  return CATS.find((c) => c.name === name) ?? { ...FALLBACK_CAT, name };
}

export interface Expense {
  id: number;
  date: string; // YYYY-MM-DD
  cat: string;
  amount: number;
  note: string;
  /** What the user typed, e.g. "2.03+3.56". Only kept when it was a calculation. */
  expr?: string;
}

/** Shape stored in localStorage under "bgt3" — same as the original HTML app. */
export interface MonthData {
  totalBudget: number;
  catBudgets: Record<string, number>;
  expenses: Expense[];
  /** True once the user saved a budget for this month. Missing on data from the old app. */
  budgetSet?: boolean;
}

export interface Budget {
  totalBudget: number;
  catBudgets: Record<string, number>;
}

/** Where the budget shown for a month comes from. */
export type BudgetSource =
  | { kind: 'own' }
  | { kind: 'carried'; from: string } // YYYY-MM
  | { kind: 'none' };

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

/** Local YYYY-MM-DD (toISOString() would give the UTC date, which is wrong near midnight). */
export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
}

export function euro(n: number): string {
  return `€${n.toFixed(2)}`;
}
