# Budget Tracker (Angular) — developer notes

For what the app does and how to use it, see the [main README](../README.md).

Mobile-first Angular version of the budget tracker in the repo root (`../index.html`).
It reads and writes the same browser storage (`bgt3`), so data entered in the old app shows up here.

## Features
- **Budget** – total + per-category limits. A month without its own budget automatically
  uses the most recent earlier month's budget ("carried over"). Saving sets a new budget from that month on.
- **Log** – amounts can be calculations: `2.03+3.56` → €5.59, `45.20-5` → €40.20.
  Use the **+ / −** buttons next to the amount box (phone number keypads don't have them).
- **Edit** – tap ✏️ Edit on any expense (Log tab or Summary drill-down) to change date,
  category, amount or note, or delete it.
- **Custom categories** – add your own (name + optional emoji) on the Budget tab.
  They appear automatically in the expense form, budgets, Summary and exports.
  A custom category can be removed (✕ on the Budget tab) once it has no expenses.
- **Summary** – tap a category (bar or legend) to see all its expenses for the month.
- Export to PDF / copy as text. Installable as an app (PWA), works offline.
- Past months: expenses can be added, edited and deleted; the budget is read-only.

## Develop
```bash
npm install
npm start               # http://localhost:4200
npx ng test --watch=false
npx ng build --base-href /budget-tracker/
```

## Deploy
After any code change, run this and commit the changed files in the repo root:
```bash
npm run publish:root
```
It builds the app and copies it to the repo root, so GitHub Pages serves the new app even when
Pages is set to "Deploy from a branch". `.pages-files` lists what it put there.

`.github/workflows/deploy-angular.yml` runs the tests on every push to `Dev` or `main`, checks
that the root build is up to date, and publishes it. Recommended setting:
**Settings → Pages → Source → GitHub Actions**.
