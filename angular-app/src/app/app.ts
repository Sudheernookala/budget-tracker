import { Component, computed, inject, signal } from '@angular/core';
import { BudgetStore } from './core/budget.store';
import { monthLabel } from './core/models';
import { ToastService } from './core/toast.service';
import { BudgetPage } from './pages/budget-page';
import { LogPage } from './pages/log-page';
import { SummaryPage } from './pages/summary-page';
import { ExpenseEditor } from './shared/expense-editor';

type Tab = 'budget' | 'summary' | 'log';

@Component({
  selector: 'app-root',
  imports: [BudgetPage, SummaryPage, LogPage, ExpenseEditor],
  template: `
    <header class="header">
      <div class="header-top">
        <h1>📊 Budget Tracker</h1>
        @if (store.readOnly()) { <span class="past-pill">PAST</span> }
      </div>
      <div class="month-nav">
        <button (click)="store.changeMonth(-1)" aria-label="Previous month">&#8592;</button>
        <span>{{ label() }}</span>
        <button (click)="store.changeMonth(1)" [disabled]="store.isCurrentMonth()" aria-label="Next month">&#8594;</button>
      </div>
    </header>

    <main class="pages">
      @switch (tab()) {
        @case ('budget') { <app-budget-page class="page" /> }
        @case ('log') { <app-log-page class="page" /> }
        @case ('summary') { <app-summary-page class="page" /> }
      }
    </main>

    <nav class="tab-bar">
      @for (t of tabs; track t.id) {
        <button class="tab-btn" [class.active]="tab() === t.id" (click)="tab.set(t.id)">
          <span class="ti">{{ t.icon }}</span>{{ t.label }}
        </button>
      }
    </nav>

    <app-expense-editor />

    @if (toast.message(); as m) {
      <div class="toast" [class.err]="m.type === 'err'">{{ m.text }}</div>
    }
  `,
})
export class App {
  protected readonly store = inject(BudgetStore);
  protected readonly toast = inject(ToastService);
  protected readonly tab = signal<Tab>('budget');
  protected readonly label = computed(() => monthLabel(this.store.viewKey()));
  protected readonly tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'budget', icon: '⚙️', label: 'Budget' },
    { id: 'log', icon: '🧾', label: 'Log' },
    { id: 'summary', icon: '📈', label: 'Summary' },
  ];
}
