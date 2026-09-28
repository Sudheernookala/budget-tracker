import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetStore } from '../core/budget.store';
import { CATS, monthLabel } from '../core/models';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-budget-page',
  imports: [FormsModule],
  template: `
    @if (store.readOnly()) {
      <div class="readonly-banner">⚠️ Viewing past month — read only</div>
    }

    @if (carriedFrom(); as from) {
      <div class="info-banner">
        🔁 Budget carried over from {{ from }}.@if (!store.readOnly()) { Edit and save to change it from this month on.}
      </div>
    }

    <div class="budget-hero">
      <div class="budget-hero-label">Total Monthly Budget</div>
      <div class="budget-hero-row">
        <span class="budget-hero-sym">€</span>
        <input class="budget-hero-input" type="number" inputmode="decimal" min="0" placeholder="0"
               [(ngModel)]="total" [disabled]="store.readOnly()" aria-label="Total monthly budget" />
      </div>
    </div>

    <div class="card">
      <div class="card-header">🎯 Category Limits</div>
      <div class="card-body">
        @for (c of cats; track c.name) {
          <div class="cat-limit-row">
            <div class="cat-dot" [style.background]="c.color"></div>
            <label class="cat-limit-name" [for]="'cl_' + c.name">{{ c.icon }} {{ c.name }}</label>
            <input class="cat-limit-input" type="number" inputmode="decimal" min="0" step="0.01" placeholder="€0"
                   [id]="'cl_' + c.name" [ngModel]="catValues()[c.name]" (ngModelChange)="setCat(c.name, $event)"
                   [disabled]="store.readOnly()" />
          </div>
        }
      </div>
    </div>

    <button class="btn btn-primary" (click)="save()" [disabled]="store.readOnly()">💾 Save Budgets</button>
  `,
})
export class BudgetPage {
  protected readonly store = inject(BudgetStore);
  private readonly toast = inject(ToastService);
  protected readonly cats = CATS;

  protected readonly total = signal<number | null>(null);
  protected readonly catValues = signal<Record<string, number | null>>({});

  constructor() {
    // Reload the form when the month (or saved budget) changes.
    effect(() => {
      const { totalBudget, catBudgets } = this.store.budgetInfo().budget;
      this.total.set(totalBudget || null);
      const vals: Record<string, number | null> = {};
      CATS.forEach((c) => (vals[c.name] = catBudgets[c.name] || null));
      this.catValues.set(vals);
    });
  }

  protected carriedFrom(): string {
    const src = this.store.budgetInfo().source;
    return src.kind === 'carried' ? monthLabel(src.from) : '';
  }

  protected setCat(name: string, value: number | null): void {
    this.catValues.update((v) => ({ ...v, [name]: value }));
  }

  protected save(): void {
    const catBudgets: Record<string, number> = {};
    CATS.forEach((c) => (catBudgets[c.name] = Math.max(0, Number(this.catValues()[c.name]) || 0)));
    this.store.saveBudget({ totalBudget: Math.max(0, Number(this.total()) || 0), catBudgets });
    this.toast.show('Budgets saved ✓');
  }
}
