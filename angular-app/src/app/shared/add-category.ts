import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BudgetStore } from '../core/budget.store';
import { ToastService } from '../core/toast.service';

/** Small form to create a category (name + optional emoji). Used on the Budget and Log tabs. */
@Component({
  selector: 'app-add-category',
  imports: [FormsModule],
  template: `
    <div class="add-cat-row">
      <input class="form-input add-cat-icon" type="text" placeholder="🏷️" maxlength="4"
             aria-label="Category emoji (optional)" [(ngModel)]="icon" [disabled]="disabled()" />
      <input class="form-input" type="text" placeholder="New category, e.g. Kids" maxlength="20"
             aria-label="New category name" [(ngModel)]="name" (keydown.enter)="add()" [disabled]="disabled()" />
      <button type="button" class="btn btn-primary add-cat-btn" (click)="add()" [disabled]="disabled()">Add</button>
    </div>
  `,
})
export class AddCategory {
  private readonly store = inject(BudgetStore);
  private readonly toast = inject(ToastService);

  readonly disabled = input(false);
  /** Emits the new category's name. */
  readonly added = output<string>();

  protected readonly name = signal('');
  protected readonly icon = signal('');

  protected add(): void {
    const err = this.store.addCategory(this.name(), this.icon());
    if (err) {
      this.toast.show(err, 'err');
      return;
    }
    const name = this.store.categories().at(-1)!.name;
    this.name.set('');
    this.icon.set('');
    this.toast.show(`Category "${name}" added ✓`);
    this.added.emit(name);
  }
}
