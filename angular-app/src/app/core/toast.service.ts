import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<{ text: string; type: 'ok' | 'err' } | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(text: string, type: 'ok' | 'err' = 'ok'): void {
    this.message.set({ text, type });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), 2200);
  }
}
