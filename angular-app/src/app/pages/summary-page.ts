import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { BudgetStore } from '../core/budget.store';
import { Category } from '../core/models';
import { ExpenseItem } from '../shared/expense-item';
import { ExpenseEditorService } from '../shared/expense-editor';

@Component({
  selector: 'app-summary-page',
  imports: [ExpenseItem],
  template: `
    <div class="summary-hero">
      <div class="summary-top">
        <div>
          <div class="sh-label">Total Spent</div>
          <div class="sh-value">€{{ t().total.toFixed(2) }}</div>
        </div>
        <div style="text-align:right">
          <div class="sh-label">Budget</div>
          <div class="sh-sub">€{{ t().budget.toFixed(2) }}</div>
          <div class="sh-remaining">{{ remainingText() }}</div>
        </div>
      </div>
      <div>
        <div class="prog-track">
          <div class="prog-fill" [style.width.%]="pct() * 100" [style.background]="progColor()"></div>
        </div>
        <div class="prog-label">{{ t().budget > 0 ? round(pct() * 100) + '% used' : 'No budget set' }}</div>
      </div>
    </div>

    @if (alert(); as a) {
      <div [class]="'alert show ' + a.cls"><span>{{ a.icon }}</span><span>{{ a.msg }}</span></div>
    }

    <div class="card">
      <div class="card-header">🥧 Spending Breakdown</div>
      <div class="card-body">
        <div class="chart-area">
          <canvas #pie width="300" height="300" style="width:150px;height:150px"></canvas>
          <div class="legend">
            @for (c of spentCats(); track c.name) {
              <button class="legend-item" (click)="toggle(c.name)" [class.selected]="selected() === c.name">
                <div class="legend-dot" [style.background]="c.color"></div>
                <span>{{ c.name }}</span>
                <span class="legend-pct">{{ round((t().byCat[c.name] / t().total) * 100) }}%</span>
              </button>
            }
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">📂 By Category <span class="card-hint">tap to see expenses</span></div>
      <div class="card-body">
        @for (c of barCats(); track c.name) {
          <button class="cat-bar" [class.selected]="selected() === c.name" (click)="toggle(c.name)">
            <div class="cat-bar-top">
              <div class="cat-bar-name">
                <div class="cat-dot" [style.background]="c.color"></div>
                {{ c.icon }} {{ c.name }}
                @if (isOver(c.name)) { <span class="over-pill">OVER</span> }
              </div>
              <div class="cat-bar-amt">
                €{{ spent(c.name).toFixed(2) }}@if (limit(c.name) > 0) { / €{{ limit(c.name).toFixed(2) }}}
                <span class="chev">{{ selected() === c.name ? '▾' : '›' }}</span>
              </div>
            </div>
            <div class="bar-track">
              <div class="bar-fill" [style.width.%]="barPct(c.name)" [style.background]="barColor(c)"></div>
            </div>
          </button>
          @if (selected() === c.name) {
            <div class="cat-detail">
              @for (e of selectedExpenses(); track e.id) {
                <app-expense-item [expense]="e" [editable]="true" (edit)="editor.open($event)" />
              } @empty {
                <div class="empty-text" style="padding:10px 0;text-align:center;color:#94a3b8">No {{ c.name }} expenses this month</div>
              }
              @if (selectedExpenses().length) {
                <div class="cat-detail-total">
                  {{ selectedExpenses().length }} expense{{ selectedExpenses().length === 1 ? '' : 's' }} · €{{ spent(c.name).toFixed(2) }}
                  @if (limit(c.name) > 0) {
                    · {{ limit(c.name) - spent(c.name) >= 0 ? '€' + (limit(c.name) - spent(c.name)).toFixed(2) + ' left' : '€' + (spent(c.name) - limit(c.name)).toFixed(2) + ' over' }}
                  }
                </div>
              }
            </div>
          }
        } @empty {
          <div class="empty"><div class="empty-icon">📂</div><div class="empty-text">No data this month</div></div>
        }
      </div>
    </div>
  `,
})
export class SummaryPage {
  protected readonly store = inject(BudgetStore);
  protected readonly editor = inject(ExpenseEditorService);
  private readonly pie = viewChild.required<ElementRef<HTMLCanvasElement>>('pie');

  protected readonly t = this.store.totals;
  protected readonly round = Math.round;
  protected readonly selected = signal<string | null>(null);

  protected readonly pct = computed(() => (this.t().budget > 0 ? Math.min(this.t().total / this.t().budget, 1) : 0));
  protected readonly spentCats = computed(() => this.store.categories().filter((c) => this.t().byCat[c.name] > 0));
  protected readonly barCats = computed(() =>
    this.store.categories().filter((c) => this.t().byCat[c.name] > 0 || this.t().catBudgets[c.name] > 0),
  );
  protected readonly selectedExpenses = computed(() => {
    const sel = this.selected();
    return sel ? this.store.expenses().filter((e) => e.cat === sel) : [];
  });

  protected readonly remainingText = computed(() => {
    const { total, budget } = this.t();
    if (budget <= 0) return '';
    const rem = budget - total;
    return rem >= 0 ? `€${rem.toFixed(2)} left` : `€${Math.abs(rem).toFixed(2)} over`;
  });

  protected readonly progColor = computed(() => {
    const { total, budget } = this.t();
    return total > budget ? '#ef4444' : total >= budget * 0.85 ? '#f59e0b' : '#22c55e';
  });

  protected readonly alert = computed(() => {
    const { total, budget } = this.t();
    if (budget > 0 && total > budget) return { cls: 'alert-danger', icon: '⚠️', msg: `Over budget by €${(total - budget).toFixed(2)}!` };
    if (budget > 0 && total >= budget * 0.85)
      return { cls: 'alert-warn', icon: '⚡', msg: `${Math.round((total / budget) * 100)}% of budget used — watch out!` };
    if (total > 0 && budget > 0) return { cls: 'alert-ok', icon: '✅', msg: `On track! €${(budget - total).toFixed(2)} remaining.` };
    return null;
  });

  constructor() {
    // Close the drill-down when switching months.
    effect(() => {
      this.store.viewKey();
      this.selected.set(null);
    });
    effect(() => this.drawPie());
  }

  protected toggle(name: string): void {
    this.selected.update((cur) => (cur === name ? null : name));
  }

  protected spent(name: string): number {
    return this.t().byCat[name] || 0;
  }
  protected limit(name: string): number {
    return this.t().catBudgets[name] || 0;
  }
  protected isOver(name: string): boolean {
    return this.limit(name) > 0 && this.spent(name) > this.limit(name);
  }
  protected barPct(name: string): number {
    const l = this.limit(name);
    return l > 0 ? Math.min(this.spent(name) / l, 1) * 100 : 0;
  }
  protected barColor(c: Category): string {
    const s = this.spent(c.name), l = this.limit(c.name);
    return l > 0 && s > l ? '#ef4444' : l > 0 && s >= l * 0.85 ? '#f59e0b' : c.color;
  }

  private drawPie(): void {
    const canvas = this.pie().nativeElement;
    const { byCat, total } = this.t();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0); // canvas is 2x for sharp rendering on phones
    const W = 150, H = 150, cx = W / 2, cy = H / 2, r = H / 2 - 6;
    ctx.clearRect(0, 0, W, H);

    if (total === 0) {
      ctx.fillStyle = '#e8edf5';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('No data', cx, cy + 4);
      return;
    }

    let start = -Math.PI / 2;
    for (const c of this.spentCats()) {
      const slice = (byCat[c.name] / total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + slice); ctx.closePath();
      ctx.fillStyle = c.color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      start += slice;
    }
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#1a2340'; ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(`€${total.toFixed(0)}`, cx, cy - 3);
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px Segoe UI, sans-serif'; ctx.fillText('total', cx, cy + 10);
  }
}
