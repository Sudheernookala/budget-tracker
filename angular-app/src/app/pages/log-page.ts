import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetStore } from '../core/budget.store';
import { evalAmount, isCalculation } from '../core/amount-expr';
import { DEFAULT_CATS, lastDayOfMonth, localDate } from '../core/models';
import { ToastService } from '../core/toast.service';
import { copyText, exportPdf } from '../core/export';
import { AddCategory } from '../shared/add-category';
import { AmountInput } from '../shared/amount-input';
import { ExpenseItem } from '../shared/expense-item';
import { ExpenseEditorService } from '../shared/expense-editor';

@Component({
  selector: 'app-log-page',
  imports: [FormsModule, AddCategory, AmountInput, ExpenseItem],
  template: `
    <div class="card">
      <div class="card-header">➕ Add Expense</div>
      <div class="card-body">
        <div class="form-row">
          <label class="form-label" for="expDate">Date</label>
          <input class="form-input" type="date" id="expDate" [(ngModel)]="date"
                 [min]="minDate()" [max]="maxDate()" [disabled]="store.readOnly()" />
        </div>
        <div class="form-row">
          <div class="label-row">
            <label class="form-label" for="expCat">Category</label>
            @if (!store.readOnly()) {
              <button type="button" class="link-btn" (click)="showNewCat.set(!showNewCat())">
                {{ showNewCat() ? 'Cancel' : '+ New category' }}
              </button>
            }
          </div>
          <select class="form-input" id="expCat" [(ngModel)]="cat" [disabled]="store.readOnly()">
            @for (c of store.categories(); track c.name) {
              <option [value]="c.name">{{ c.icon }} {{ c.name }}</option>
            }
          </select>
          @if (showNewCat()) {
            <div style="margin-top:8px">
              <app-add-category (added)="cat.set($event); showNewCat.set(false)" />
            </div>
          }
        </div>
        <div class="form-row">
          <label class="form-label" for="expAmount">Amount (€)</label>
          <app-amount-input inputId="expAmount" [(value)]="amountText" [disabled]="store.readOnly()" />
        </div>
        <div class="form-row">
          <label class="form-label" for="expNote">Note (optional)</label>
          <input class="form-input" type="text" id="expNote" placeholder="e.g. Grocery run"
                 [(ngModel)]="note" [disabled]="store.readOnly()" />
        </div>
        <button class="btn btn-green" style="margin-top:4px" (click)="add()" [disabled]="store.readOnly()">+ Add Expense</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">🧾 Expense Log</div>
      <div class="card-body">
        @for (e of store.expenses(); track e.id) {
          <app-expense-item [expense]="e" [editable]="!store.readOnly()" (edit)="editor.open($event)" />
        } @empty {
          <div class="empty"><div class="empty-icon">🧾</div><div class="empty-text">No expenses this month</div></div>
        }
      </div>
    </div>

    <div class="card">
      <div class="card-header">📤 Export</div>
      <div class="card-body">
        <div class="btn-row">
          <button class="btn btn-primary" (click)="pdf()">⬇ PDF</button>
          <button class="btn btn-outline" (click)="copy()">📋 Copy</button>
        </div>
      </div>
    </div>
  `,
})
export class LogPage {
  protected readonly store = inject(BudgetStore);
  protected readonly editor = inject(ExpenseEditorService);
  private readonly toast = inject(ToastService);

  protected readonly date = signal(localDate());
  protected readonly cat = signal(DEFAULT_CATS[0].name);
  protected readonly showNewCat = signal(false);
  protected readonly amountText = signal('');
  protected readonly note = signal('');

  protected readonly minDate = computed(() => `${this.store.viewKey()}-01`);
  protected readonly maxDate = computed(() => lastDayOfMonth(this.store.viewKey()));

  constructor() {
    // Default the date to today when on the current month.
    effect(() => {
      if (this.store.isCurrentMonth()) this.date.set(localDate());
    });
  }

  protected add(): void {
    const text = this.amountText().trim();
    const amount = evalAmount(text);
    const date = this.date();
    if (!date || !this.cat() || amount === null || amount <= 0) {
      this.toast.show('Fill in date, category & amount', 'err');
      return;
    }
    if (date < this.minDate() || date > this.maxDate()) {
      this.toast.show('Date must be in this month', 'err');
      return;
    }
    this.store.addExpense({
      date,
      cat: this.cat(),
      amount,
      note: this.note().trim(),
      ...(isCalculation(text) ? { expr: text } : {}),
    });
    this.amountText.set('');
    this.note.set('');
    this.toast.show(`Expense added ✓ €${amount.toFixed(2)}`);
  }

  protected async pdf(): Promise<void> {
    try {
      await exportPdf(this.store);
    } catch {
      this.toast.show('PDF export failed', 'err');
    }
  }

  protected async copy(): Promise<void> {
    try {
      await copyText(this.store);
      this.toast.show('Copied ✓');
    } catch {
      this.toast.show('Copy failed', 'err');
    }
  }
}
