# 📊 Budget Tracker

A simple monthly budget app built for your phone. Set a budget, log what you spend, and see where your money goes.

**Open the app:** https://sudheernookala.github.io/budget-tracker/

- Works in any mobile or desktop browser. No account and no sign-up.
- Can be installed on your home screen and works offline.
- Your data stays on your device. Nothing is sent to a server.

---

## Features

- **Monthly budget:** set a total budget and a limit for each category.
- **Budgets carry over:** next month uses this month's budget automatically. You don't have to enter it again.
- **Calculator in the amount box:** type `2.03+3.56` and it saves **€5.59**. Plus and minus both work.
- **Your own categories:** add categories like "Kids" or "Gym", with an emoji of your choice.
- **Edit or delete expenses:** fix a wrong amount, date, category or note at any time, in any month.
- **Summary with drill-down:** see a pie chart and a bar for each category. Tap a category to see every expense in it.
- **Warnings:** the app tells you when you reach 85% of your budget, and when you go over it.
- **Export:** download the month as a PDF, or copy it as text to share.
- **Past months:** use the ← arrow to go back to an earlier month. You can add, edit or delete its expenses. Its budget stays locked.

---

## How to use

### 1. Install it on your phone (optional)
- **Android (Chrome):** open the link → tap the ⋮ menu → **Add to Home screen** / **Install app**.
- **iPhone (Safari):** open the link → tap **Share** → **Add to Home Screen**.

### 2. Set your budget (⚙️ Budget tab)
1. Enter your **Total Monthly Budget**.
2. Enter a limit for each category you care about. Leave the rest empty.
3. Tap **💾 Save Budgets**.

Your budget is used for every following month until you change it. When a month uses last month's budget, a blue note says **"Budget carried over from …"**. To change it from this month on, edit the numbers and save again.

### 3. Add your own category (optional)
On the **Budget** tab, scroll to **Add your own category**. Type a name, pick an emoji if you like, and tap **Add**.
The new category then appears automatically in the Log tab's category list and in the Summary.

To remove a category you added, tap its **✕** on the Budget tab. You can only remove it once no expense uses it. The built-in categories can't be removed.

### 4. Log an expense (🧾 Log tab)
1. Check the **date** (today is filled in for you).
2. Pick a **category**.
3. Enter the **amount**. You can do a quick sum:
   - `12.50` → €12.50
   - `2.03+3.56` → €5.59
   - `45.20-5` → €40.20 (for example, a coupon)
   - Use the **+** and **−** buttons next to the box, because phone number keypads don't have them.
   - The result is shown under the box (for example, **= €5.59**) before you save.
4. Add a **note** if you like, then tap **+ Add Expense**.

### 5. Edit or delete an expense
Tap **✏️ Edit** on any expense, either in the Log list or in the Summary. You can change the date, category, amount or note. To remove it, tap **🗑 Delete expense**.

### 6. Check your spending (📈 Summary tab)
- The top card shows **spent vs. budget** and how much is left.
- The **pie chart** shows how your spending splits between categories.
- **By Category** shows each category against its limit. Tap a category to see all its expenses, with the total and how much is left.

### 7. Export
On the Log tab, tap **⬇ PDF** to download the month, or **📋 Copy** to copy it as text.

---

## Good to know

- **Data is saved only in this browser, on this device.** It doesn't sync between your phone and your computer.
- **Clearing your browser data, or uninstalling the browser, deletes your budget and expenses.** Export a PDF regularly if the history matters to you.
- **Forgot to log something last month?** Tap ← to go to that month, then add it on the Log tab. The date is limited to that month.
- **Past budgets are locked.** You can change a budget only for the current month.
- **Amounts are in euros (€).**

---

## For developers

The app is built with **Angular** and lives in [`angular-app/`](angular-app/). See [`angular-app/README.md`](angular-app/README.md) for how to run, test and build it.

- The files in the repo root (`index.html`, `main-*.js`, `chunk-*.js`, `ngsw*`, `icons/` …) are the **built app**, created by `npm run publish:root`. Don't edit them by hand. After changing code in `angular-app/`, run that command and commit the result.
- Every push to `Dev` or `main` is tested and published by [`.github/workflows/deploy-angular.yml`](.github/workflows/deploy-angular.yml). It fails if the root build is out of date.
- The old single-file version of the app is kept in [`legacy/`](legacy/) for reference.
