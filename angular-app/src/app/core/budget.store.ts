import { Injectable, computed, signal } from '@angular/core';
import { Budget, BudgetSource, CATS, Expense, MonthData, monthKey } from './models';

/** Same key as the original HTML app, so existing data keeps working. */
const STORAGE_KEY = 'bgt3';

type State = Record<string, MonthData>;

function loadState(): State {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function emptyMonth(): MonthData {
  return { totalBudget: 0, catBudgets: {}, expenses: [] };
}

/** Did the user set a budget for this month (as opposed to it being empty / carried)? */
function hasOwnBudget(m: MonthData | undefined): boolean {
  if (!m) return false;
  if (m.budgetSet !== undefined) return m.budgetSet;
  // Data from the old app has no flag: treat any non-zero amount as a saved budget.
  return m.totalBudget > 0 || Object.values(m.catBudgets ?? {}).some((v) => v > 0);
}

function withAllCats(catBudgets: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  CATS.forEach((c) => (out[c.name] = catBudgets?.[c.name] || 0));
  return out;
}

@Injectable({ providedIn: 'root' })
export class BudgetStore {
  private readonly today = new Date();
  readonly currentKey = monthKey(this.today.getFullYear(), this.today.getMonth());

  private readonly state = signal<State>(loadState());
  readonly viewKey = signal(this.currentKey);

  readonly isCurrentMonth = computed(() => this.viewKey() === this.currentKey);
  readonly readOnly = computed(() => !this.isCurrentMonth());

  private readonly monthRaw = computed(() => this.state()[this.viewKey()] ?? emptyMonth());

  /**
   * The month's own budget if it has one, otherwise the most recent earlier month's.
   * This is what makes budgets roll over to the next month without re-entering them.
   */
  readonly budgetInfo = computed<{ budget: Budget; source: BudgetSource }>(() => {
    const ym = this.viewKey();
    const s = this.state();
    if (hasOwnBudget(s[ym])) {
      return { budget: { totalBudget: s[ym].totalBudget || 0, catBudgets: withAllCats(s[ym].catBudgets) }, source: { kind: 'own' } };
    }
    const from = Object.keys(s)
      .filter((k) => k < ym && hasOwnBudget(s[k]))
      .sort()
      .pop();
    if (from) {
      return { budget: { totalBudget: s[from].totalBudget || 0, catBudgets: withAllCats(s[from].catBudgets) }, source: { kind: 'carried', from } };
    }
    return { budget: { totalBudget: 0, catBudgets: withAllCats({}) }, source: { kind: 'none' } };
  });

  /** Newest first (by date, then by when it was added). */
  readonly expenses = computed(() =>
    [...this.monthRaw().expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
  );

  readonly totals = computed(() => {
    const byCat: Record<string, number> = {};
    CATS.forEach((c) => (byCat[c.name] = 0));
    let cents = 0;
    for (const e of this.monthRaw().expenses) {
      byCat[e.cat] = Math.round(((byCat[e.cat] || 0) + e.amount) * 100) / 100;
      cents += Math.round(e.amount * 100);
    }
    const { totalBudget, catBudgets } = this.budgetInfo().budget;
    return { total: cents / 100, byCat, budget: totalBudget, catBudgets };
  });

  // ── Month navigation ───────────────────────────────────────────────────────
  changeMonth(dir: number): void {
    const [y, m] = this.viewKey().split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    const next = monthKey(d.getFullYear(), d.getMonth());
    if (next > this.currentKey) return;
    this.viewKey.set(next);
  }

  // ── Mutations (current month only, like the original app) ────────────────
  saveBudget(budget: Budget): void {
    this.updateMonth((m) => ({ ...m, totalBudget: budget.totalBudget, catBudgets: withAllCats(budget.catBudgets), budgetSet: true }));
  }

  addExpense(e: Omit<Expense, 'id'>): void {
    this.updateMonth((m) => ({ ...m, expenses: [{ id: Date.now(), ...e }, ...m.expenses] }));
  }

  updateExpense(updated: Expense): void {
    this.updateMonth((m) => ({ ...m, expenses: m.expenses.map((e) => (e.id === updated.id ? updated : e)) }));
  }

  deleteExpense(id: number): void {
    this.updateMonth((m) => ({ ...m, expenses: m.expenses.filter((e) => e.id !== id) }));
  }

  private updateMonth(fn: (m: MonthData) => MonthData): void {
    if (this.readOnly()) return;
    const ym = this.viewKey();
    // Re-read storage first so we never overwrite changes made in another tab.
    const s = { ...loadState() };
    s[ym] = fn(s[ym] ?? emptyMonth());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (err) {
      console.warn('Storage error', err);
    }
    this.state.set(s);
  }
}
