import { Component, ElementRef, computed, input, model, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { evalAmount, isCalculation } from '../core/amount-expr';

/**
 * Amount field that accepts calculations like "2.03+3.56".
 * Phone number keypads have no + / − keys, so we add our own buttons.
 */
@Component({
  selector: 'app-amount-input',
  imports: [FormsModule],
  template: `
    <div class="amount-row">
      <input #box class="form-input amount-box" type="text" inputmode="decimal"
             autocomplete="off" placeholder="0.00  (e.g. 2.03+3.56)"
             [id]="inputId()" [(ngModel)]="value" [disabled]="disabled()"
             [class.invalid]="invalid()" />
      <button type="button" class="op-btn" (click)="append('+')" [disabled]="disabled()" aria-label="Plus">+</button>
      <button type="button" class="op-btn" (click)="append('-')" [disabled]="disabled()" aria-label="Minus">−</button>
    </div>
    @if (invalid()) {
      <div class="amount-hint err">Use numbers with + or − only</div>
    } @else if (showResult()) {
      <div class="amount-hint">= €{{ result()!.toFixed(2) }}</div>
    }
  `,
})
export class AmountInput {
  readonly value = model('');
  readonly disabled = input(false);
  readonly inputId = input('amount');

  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  readonly result = computed(() => evalAmount(this.value()));
  readonly invalid = computed(() => this.value().trim() !== '' && this.result() === null && !/[+\-−–]\s*$/.test(this.value()));
  readonly showResult = computed(() => this.result() !== null && isCalculation(this.value()));

  append(op: '+' | '-'): void {
    const v = this.value().trimEnd();
    // Replace a trailing operator instead of stacking "5+-".
    const next = (/[+\-]$/.test(v) ? v.slice(0, -1) : v) + op;
    // Write to the box right away (ngModel updates it a tick later), so fast typing isn't lost.
    const el = this.box().nativeElement;
    el.value = next;
    this.value.set(next);
    el.focus();
    el.setSelectionRange(next.length, next.length);
  }
}
