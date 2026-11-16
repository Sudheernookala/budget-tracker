import { Injectable, computed, signal } from '@angular/core';
import { Budget, BudgetSource, CUSTOM_CAT_COLORS, Category, DEFAULT_CATS, Expense, MonthData, monthKey } from './models';

/** Same key as the original HTML app, so existing data keeps working. */
const STORAGE_KEY = 'bgt3';
/** User-added categories, kept apart so the month data format stays unchanged. */
const CATS_KEY = 'bgt3-cats';

type State = Record<string, MonthData>;

function loadState(): State {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function loadCustomCats(): Category[] {
  try {
    const cats = JSON.parse(localStorage.getItem(CATS_KEY) || '[]');
    return Array.isArray(cats) ? cats : [];
  } catch {
    return [];
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

function withAllCats(cats: Category[], catBudgets: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  cats.forEach((c) => (out[c.name] = catBudgets?.[c.name] || 0));
  return out;
}

@Injectable({ providedIn: 'root' })
export class BudgetStore {
  private readonly today = new Date();
  readonly currentKey = monthKey(this.today.getFullYear(), this.today.getMonth());

  private readonly state = signal<State>(loadState());
  readonly viewKey = signal(this.currentKey);

  private readonly customCats = signal<Category[]>(loadCustomCats());
  /** Built-in categories followed by the user's own that are in use for the month being viewed. */
  readonly categories = computed(() => {
    const ym = this.viewKey();
    return [...DEFAULT_CATS, ...this.customCats().filter((c) => !c.hiddenFrom || ym < c.hiddenFrom)];
  });

  readonly isCurrentMonth = computed(() => this.viewKey() === this.currentKey);
  /** Budgets can only be changed for the current month. Expenses can be added to any month. */
  readonly readOnly = computed(() => !this.isCurrentMonth());

  private readonly monthRaw = computed(() => this.state()[this.viewKey()] ?? emptyMonth());

  /**
   * The month's own budget if it has one, otherwise the most recent earlier month's.
   * This is what makes budgets roll over to the next month without re-entering them.
   */
  readonly budgetInfo = computed<{ budget: Budget; source: BudgetSource }>(() => {
    const ym = this.viewKey();
    const s = this.state();
    const cats = this.categories();
    if (hasOwnBudget(s[ym])) {
      return { budget: { totalBudget: s[ym].totalBudget || 0, catBudgets: withAllCats(cats, s[ym].catBudgets) }, source: { kind: 'own' } };
    }
    const from = Object.keys(s)
      .filter((k) => k < ym && hasOwnBudget(s[k]))
      .sort()
      .pop();
    if (from) {
      return { budget: { totalBudget: s[from].totalBudget || 0, catBudgets: withAllCats(cats, s[from].catBudgets) }, source: { kind: 'carried', from } };
    }
    return { budget: { totalBudget: 0, catBudgets: withAllCats(cats, {}) }, source: { kind: 'none' } };
  });

  /** Newest first (by date, then by when it was added). */
  readonly expenses = computed(() =>
    [...this.monthRaw().expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
  );

  readonly totals = computed(() => {
    const byCat: Record<string, number> = {};
    this.categories().forEach((c) => (byCat[c.name] = 0));
    let cents = 0;
    for (const e of this.monthRaw().expenses) {
      byCat[e.cat] = Math.round(((byCat[e.cat] || 0) + e.amount) * 100) / 100;
      cents += Math.round(e.amount * 100);
    }
    const { totalBudget, catBudgets } = this.budgetInfo().budget;
    return { total: cents / 100, byCat, budget: totalBudget, catBudgets };
  });

  /** Colour/icon for a category name. Unknown names (e.g. from old data) get a grey tag. */
  catInfo(name: string): Category {
    return this.categories().find((c) => c.name === name) ?? { name, color: '#94a3b8', icon: '🏷️' };
  }

  /** A user-added category shown in the month being viewed. */
  isCustomCategory(name: string): boolean {
    return this.categories().some((c) => c.name === name && !DEFAULT_CATS.includes(c));
  }

  /** Adds a category for all months. Returns an error message, or null on success. */
  addCategory(rawName: string, rawIcon: string): string | null {
    const name = rawName.trim().replace(/\s+/g, ' ');
    if (!name) return 'Enter a category name';
    if (name.length > 20) return 'Name is too long (max 20 characters)';
    if (this.categories().some((c) => c.name.toLowerCase() === name.toLowerCase())) return `"${name}" already exists`;
    // Adding back a category removed earlier: show it again instead of making a duplicate.
    const removed = this.customCats().find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (removed) {
      this.saveCustomCats(this.customCats().map((c) => (c === removed ? { name: c.name, icon: c.icon, color: c.color } : c)));
      return null;
    }
    const icon = [...rawIcon.trim()].slice(0, 2).join('') || '🏷️';
    const color = CUSTOM_CAT_COLORS[this.customCats().length % CUSTOM_CAT_COLORS.length];
    this.saveCustomCats([...this.customCats(), { name, icon, color }]);
    return null;
  }

  /**
   * Removes a user-added category from the current month onward.
   * - Never used: deleted completely.
   * - Used only in earlier months: hidden from now on, but kept in those months so their
   *   expenses and totals stay the same.
   * - Used this month: refused, because those expenses would lose their category.
   */
  removeCategory(name: string): string | null {
    const state = loadState();
    const from = this.currentKey;
    const usedFrom = Object.entries(state).some(([k, m]) => k >= from && m.expenses?.some((e) => e.cat === name));
    if (usedFrom) return `"${name}" has expenses this month. Move them to another category or delete them first.`;
    const usedBefore = Object.values(state).some((m) => m.expenses?.some((e) => e.cat === name));
    this.saveCustomCats(
      usedBefore
        ? this.customCats().map((c) => (c.name === name ? { ...c, hiddenFrom: from } : c))
        : this.customCats().filter((c) => c.name !== name),
    );
    return null;
  }

  private saveCustomCats(cats: Category[]): void {
    try {
      localStorage.setItem(CATS_KEY, JSON.stringify(cats));
    } catch (err) {
      console.warn('Storage error', err);
    }
    this.customCats.set(cats);
  }

  // ── Month navigation ───────────────────────────────────────────────────────
  changeMonth(dir: number): void {
    const [y, m] = this.viewKey().split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    const next = monthKey(d.getFullYear(), d.getMonth());
    if (next > this.currentKey) return;
    this.viewKey.set(next);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  saveBudget(budget: Budget): void {
    if (this.readOnly()) return; // past budgets stay as they were
    this.updateMonth((m) => ({ ...m, totalBudget: budget.totalBudget, catBudgets: withAllCats(this.categories(), budget.catBudgets), budgetSet: true }));
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
