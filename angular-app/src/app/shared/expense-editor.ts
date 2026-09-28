import { Component, Injectable, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetStore } from '../core/budget.store';
import { evalAmount, isCalculation } from '../core/amount-expr';
import { Expense, lastDayOfMonth } from '../core/models';
import { ToastService } from '../core/toast.service';
import { AmountInput } from './amount-input';

/** Lets any page open the edit sheet for an expense. */
@Injectable({ providedIn: 'root' })
export class ExpenseEditorService {
  readonly editing = signal<Expense | null>(null);
  open(e: Expense): void {
    this.editing.set(e);
  }
  close(): void {
    this.editing.set(null);
  }
}

/** Bottom sheet for editing or deleting one expense. */
@Component({
  selector: 'app-expense-editor',
  imports: [FormsModule, AmountInput],
  template: `
    @if (editor.editing(); as e) {
      <div class="sheet-backdrop" (click)="editor.close()"></div>
      <div class="sheet" role="dialog" aria-label="Edit expense">
        <div class="sheet-handle"></div>
        <div class="sheet-title">✏️ Edit Expense</div>

        <div class="form-row">
          <label class="form-label" for="edDate">Date</label>
          <input class="form-input" type="date" id="edDate" [(ngModel)]="date" [min]="minDate()" [max]="maxDate()" />
        </div>
        <div class="form-row">
          <label class="form-label" for="edCat">Category</label>
          <select class="form-input" id="edCat" [(ngModel)]="cat">
            @for (c of store.categories(); track c.name) {
              <option [value]="c.name">{{ c.icon }} {{ c.name }}</option>
            }
          </select>
        </div>
        <div class="form-row">
          <label class="form-label" for="edAmount">Amount (€)</label>
          <app-amount-input inputId="edAmount" [(value)]="amountText" />
        </div>
        <div class="form-row">
          <label class="form-label" for="edNote">Note (optional)</label>
          <input class="form-input" type="text" id="edNote" [(ngModel)]="note" />
        </div>

        <div class="btn-row" style="margin-top:6px">
          <button class="btn btn-outline" (click)="editor.close()">Cancel</button>
          <button class="btn btn-green" (click)="save(e)">Save</button>
        </div>
        <button class="btn btn-danger-soft" style="margin-top:10px" (click)="remove(e)">🗑 Delete expense</button>
      </div>
    }
  `,
})
export class ExpenseEditor {
  protected readonly editor = inject(ExpenseEditorService);
  protected readonly store = inject(BudgetStore);
  private readonly toast = inject(ToastService);

  protected readonly date = signal('');
  protected readonly cat = signal('');
  protected readonly amountText = signal('');
  protected readonly note = signal('');

  protected readonly minDate = computed(() => `${this.store.viewKey()}-01`);
  protected readonly maxDate = computed(() => lastDayOfMonth(this.store.viewKey()));

  constructor() {
    // Fill the form whenever a new expense is opened.
    effect(() => {
      const e = this.editor.editing();
      if (!e) return;
      this.date.set(e.date);
      this.cat.set(e.cat);
      this.amountText.set(e.expr ?? String(e.amount));
      this.note.set(e.note);
    });
  }

  save(original: Expense): void {
    const amount = evalAmount(this.amountText());
    const date = this.date();
    if (!date || amount === null || amount <= 0) {
      this.toast.show('Enter a valid date & amount above 0', 'err');
      return;
    }
    if (date < this.minDate() || date > this.maxDate()) {
      this.toast.show('Date must be in this month', 'err');
      return;
    }
    const text = this.amountText().trim();
    this.store.updateExpense({
      ...original,
      date,
      cat: this.cat(),
      amount,
      note: this.note().trim(),
      expr: isCalculation(text) ? text : undefined,
    });
    this.editor.close();
    this.toast.show('Expense updated ✓');
  }

  remove(e: Expense): void {
    if (!confirm(`Delete this €${e.amount.toFixed(2)} ${e.cat} expense?`)) return;
    this.store.deleteExpense(e.id);
    this.editor.close();
    this.toast.show('Deleted');
  }
}
