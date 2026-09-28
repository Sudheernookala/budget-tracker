import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetStore } from '../core/budget.store';
import { monthLabel } from '../core/models';
import { ToastService } from '../core/toast.service';
import { AddCategory } from '../shared/add-category';

@Component({
  selector: 'app-budget-page',
  imports: [FormsModule, AddCategory],
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
        @for (c of store.categories(); track c.name) {
          <div class="cat-limit-row">
            <div class="cat-dot" [style.background]="c.color"></div>
            <label class="cat-limit-name" [for]="'cl_' + c.name">{{ c.icon }} {{ c.name }}</label>
            <input class="cat-limit-input" type="number" inputmode="decimal" min="0" step="0.01" placeholder="€0"
                   [id]="'cl_' + c.name" [ngModel]="catValues()[c.name]" (ngModelChange)="setCat(c.name, $event)"
                   [disabled]="store.readOnly()" />
            @if (store.isCustomCategory(c.name) && !store.readOnly()) {
              <button type="button" class="cat-remove" (click)="remove(c.name)" [attr.aria-label]="'Remove ' + c.name">✕</button>
            }
          </div>
        }
        @if (!store.readOnly()) {
          <div class="add-cat-block">
            <div class="form-label">Add your own category</div>
            <app-add-category />
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

  protected readonly total = signal<number | null>(null);
  protected readonly catValues = signal<Record<string, number | null>>({});

  constructor() {
    // Reload the form when the month (or saved budget) changes.
    // Reload the form when the month or the saved budget changes. When only a category was
    // added, keep what the user has typed but not saved yet.
    let lastSig = '';
    effect(() => {
      const { totalBudget, catBudgets } = this.store.budgetInfo().budget;
      const vals: Record<string, number | null> = {};
      this.store.categories().forEach((c) => (vals[c.name] = catBudgets[c.name] || null));
      const saved = Object.entries(catBudgets).filter(([, v]) => v > 0);
      const sig = JSON.stringify([this.store.viewKey(), totalBudget, saved]);
      if (sig !== lastSig) {
        lastSig = sig;
        this.total.set(totalBudget || null);
        this.catValues.set(vals);
      } else {
        this.catValues.update((typed) => ({ ...vals, ...typed }));
      }
    });
  }

  protected carriedFrom(): string {
    const src = this.store.budgetInfo().source;
    return src.kind === 'carried' ? monthLabel(src.from) : '';
  }

  protected setCat(name: string, value: number | null): void {
    this.catValues.update((v) => ({ ...v, [name]: value }));
  }

  protected remove(name: string): void {
    if (!confirm(`Remove category "${name}"?`)) return;
    const err = this.store.removeCategory(name);
    this.toast.show(err ?? `Removed "${name}"`, err ? 'err' : 'ok');
  }

  protected save(): void {
    const catBudgets: Record<string, number> = {};
    this.store.categories().forEach((c) => (catBudgets[c.name] = Math.max(0, Number(this.catValues()[c.name]) || 0)));
    this.store.saveBudget({ totalBudget: Math.max(0, Number(this.total()) || 0), catBudgets });
    this.toast.show('Budgets saved ✓');
  }
}
