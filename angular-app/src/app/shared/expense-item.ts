import { Component, computed, input, output } from '@angular/core';
import { Expense, catInfo } from '../core/models';

@Component({
  selector: 'app-expense-item',
  template: `
    <div class="expense-item">
      <div class="exp-ico" [style.background]="cat().color + '22'" [style.color]="cat().color">{{ cat().icon }}</div>
      <div class="exp-info">
        <div class="exp-cat">{{ expense().cat }}</div>
        <div class="exp-note">{{ expense().note || '—' }}</div>
        <div class="exp-date">
          {{ expense().date }}
          @if (expense().expr) {
            <span class="exp-expr">· {{ expense().expr }}</span>
          }
        </div>
      </div>
      <div class="exp-right">
        <div class="exp-amt">€{{ expense().amount.toFixed(2) }}</div>
        @if (editable()) {
          <button class="btn-edit-sm" (click)="edit.emit(expense())">✏️ Edit</button>
        }
      </div>
    </div>
  `,
})
export class ExpenseItem {
  readonly expense = input.required<Expense>();
  readonly editable = input(false);
  readonly edit = output<Expense>();
  protected readonly cat = computed(() => catInfo(this.expense().cat));
}
