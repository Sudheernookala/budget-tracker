import { BudgetStore } from './budget.store';
import { monthLabel } from './models';

export async function copyText(store: BudgetStore): Promise<void> {
  const { total, byCat, budget } = store.totals();
  const line = '─'.repeat(38);
  let txt = `Budget Tracker — ${monthLabel(store.viewKey())}\n`;
  txt += `${line}\nSpent: €${total.toFixed(2)} / Budget: €${budget.toFixed(2)}\n${line}\n`;
  store.categories().filter((c) => byCat[c.name] > 0).forEach((c) => (txt += `${c.name}: €${byCat[c.name].toFixed(2)}\n`));
  txt += `${line}\n`;
  store.expenses().forEach((e) => (txt += `${e.date} | ${e.cat} | €${e.amount.toFixed(2)}${e.note ? ' | ' + e.note : ''}\n`));
  await navigator.clipboard.writeText(txt);
}

/** Same PDF layout as the original app. jsPDF is loaded only when needed to keep startup fast. */
export async function exportPdf(store: BudgetStore): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { total, byCat, budget, catBudgets } = store.totals();
  const expenses = store.expenses();
  const blue: [number, number, number] = [27, 58, 107];
  const gray: [number, number, number] = [74, 90, 122];
  const light: [number, number, number] = [228, 234, 244];
  const black: [number, number, number] = [26, 35, 64];

  doc.setFillColor(...blue); doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('Monthly Budget Tracker', 14, 10);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(monthLabel(store.viewKey()), 14, 17);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 17, { align: 'right' });

  let y = 30;
  doc.setTextColor(...black); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, y); y += 6;
  doc.setFillColor(...light); doc.roundedRect(14, y, 182, 18, 3, 3, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  doc.text('Total Spent', 20, y + 6); doc.text('Budget', 80, y + 6); doc.text('Remaining', 140, y + 6);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...black);
  doc.text(`€${total.toFixed(2)}`, 20, y + 13); doc.text(`€${budget.toFixed(2)}`, 80, y + 13);
  const rem = budget - total;
  if (rem < 0) doc.setTextColor(192, 57, 43); else doc.setTextColor(27, 58, 107);
  doc.text(`€${rem.toFixed(2)}`, 140, y + 13); y += 26;

  doc.setFillColor(...light); doc.roundedRect(14, y, 182, 5, 2, 2, 'F');
  const pct = budget > 0 ? Math.min(total / budget, 1) : 0;
  const progColor: [number, number, number] = total > budget ? [192, 57, 43] : total >= budget * 0.85 ? [230, 126, 34] : [27, 122, 58];
  doc.setFillColor(...progColor);
  if (pct > 0) doc.roundedRect(14, y, 182 * pct, 5, 2, 2, 'F');
  y += 14;

  doc.setTextColor(...black); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', 14, y); y += 6;
  store.categories().filter((c) => byCat[c.name] > 0 || catBudgets[c.name] > 0).forEach((c) => {
    const spent = byCat[c.name] || 0, limit = catBudgets[c.name] || 0;
    const r = parseInt(c.color.slice(1, 3), 16), g = parseInt(c.color.slice(3, 5), 16), b = parseInt(c.color.slice(5, 7), 16);
    doc.setFillColor(r, g, b); doc.circle(17, y + 2, 2, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...black);
    doc.text(c.name, 22, y + 3.5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
    doc.text(`€${spent.toFixed(2)}${limit > 0 ? ' / €' + limit.toFixed(2) : ''}`, 100, y + 3.5);
    if (limit > 0 && spent > limit) { doc.setTextColor(192, 57, 43); doc.setFont('helvetica', 'bold'); doc.text('OVER', 165, y + 3.5); }
    doc.setFillColor(...light); doc.roundedRect(22, y + 5, 80, 2.5, 1, 1, 'F');
    if (limit > 0 && spent > 0) {
      const p = Math.min(spent / limit, 1);
      if (spent > limit) doc.setFillColor(192, 57, 43);
      else if (spent >= limit * 0.85) doc.setFillColor(230, 126, 34);
      else doc.setFillColor(r, g, b);
      doc.roundedRect(22, y + 5, 80 * p, 2.5, 1, 1, 'F');
    }
    y += 12;
    if (y > 260) { doc.addPage(); y = 20; }
  });

  y += 4;
  doc.setTextColor(...black); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('Expense Log', 14, y); y += 6;
  doc.setFillColor(...blue); doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('Date', 17, y + 5); doc.text('Category', 50, y + 5); doc.text('Note', 95, y + 5);
  doc.text('Amount', 175, y + 5, { align: 'right' }); y += 10;
  if (!expenses.length) {
    doc.setTextColor(...gray); doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
    doc.text('No expenses logged.', 14, y);
  } else {
    expenses.forEach((e, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (i % 2 === 0) { doc.setFillColor(247, 249, 252); doc.rect(14, y - 4, 182, 7, 'F'); }
      doc.setTextColor(...black); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(e.date, 17, y); doc.text(e.cat, 50, y);
      doc.text(e.note ? e.note.substring(0, 35) : '—', 95, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`€${e.amount.toFixed(2)}`, 175, y, { align: 'right' }); y += 7;
    });
    doc.setFillColor(...light); doc.rect(14, y - 2, 182, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...blue);
    doc.text('Total', 17, y + 4); doc.text(`€${total.toFixed(2)}`, 175, y + 4, { align: 'right' });
  }
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  doc.text('Generated by Monthly Budget Tracker', 105, 290, { align: 'center' });
  doc.save(`budget-${store.viewKey()}.pdf`);
}
