import { BudgetStore } from './budget.store';
import { monthKey } from './models';

function keyOffset(months: number): string {
  const d = new Date();
  const x = new Date(d.getFullYear(), d.getMonth() + months, 1);
  return monthKey(x.getFullYear(), x.getMonth());
}

describe('BudgetStore', () => {
  beforeEach(() => localStorage.clear());

  it('carries the latest earlier budget into a month without one', () => {
    localStorage.setItem(
      'bgt3',
      JSON.stringify({
        [keyOffset(-3)]: { totalBudget: 500, catBudgets: { Food: 100 }, expenses: [] },
        [keyOffset(-2)]: { totalBudget: 900, catBudgets: { Food: 300 }, expenses: [] },
        // Old-app month that only has expenses: no budget of its own.
        [keyOffset(-1)]: { totalBudget: 0, catBudgets: { Food: 0 }, expenses: [{ id: 1, date: 'x', cat: 'Food', amount: 5, note: '' }] },
      }),
    );
    const store = new BudgetStore();
    const info = store.budgetInfo();
    expect(info.source).toEqual({ kind: 'carried', from: keyOffset(-2) });
    expect(info.budget.totalBudget).toBe(900);
    expect(info.budget.catBudgets['Food']).toBe(300);
  });

  it('uses its own budget once saved, and adds/edits expenses', () => {
    localStorage.setItem('bgt3', JSON.stringify({ [keyOffset(-1)]: { totalBudget: 900, catBudgets: {}, expenses: [] } }));
    const store = new BudgetStore();
    store.saveBudget({ totalBudget: 1000, catBudgets: { Food: 200 } });
    expect(store.budgetInfo().source.kind).toBe('own');
    expect(store.totals().budget).toBe(1000);

    store.addExpense({ date: `${store.currentKey}-01`, cat: 'Food', amount: 5.59, note: '', expr: '2.03+3.56' });
    const [e] = store.expenses();
    store.updateExpense({ ...e, amount: 7, cat: 'Transport' });
    expect(store.totals().byCat['Food']).toBe(0);
    expect(store.totals().byCat['Transport']).toBe(7);

    // Persisted in the same format as the old app.
    const saved = JSON.parse(localStorage.getItem('bgt3')!);
    expect(saved[store.currentKey].expenses[0].amount).toBe(7);
  });

  it('does not change past months', () => {
    const store = new BudgetStore();
    store.changeMonth(-1);
    store.addExpense({ date: `${keyOffset(-1)}-01`, cat: 'Food', amount: 1, note: '' });
    expect(store.expenses().length).toBe(0);
  });
});
