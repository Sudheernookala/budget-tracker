/**
 * Evaluates an amount typed by the user, allowing + and - between numbers.
 *   "12.50"          -> 12.5
 *   "2.03+3.56"      -> 5.59
 *   "10 - 2,5 + 1"   -> 8.5   (comma works as decimal point)
 * Returns null when the text is not a valid calculation.
 * No eval() — only numbers, + and - are accepted.
 */
export function evalAmount(input: string): number | null {
  const text = input
    .replace(/[−–]/g, '-') // unicode minus / dash from some keyboards
    .replace(/,/g, '.')
    .replace(/\s+/g, '');
  if (!text) return null;

  const tokens = text.match(/[+-]|\d*\.\d+|\d+\.?/g);
  if (!tokens || tokens.join('') !== text) return null;

  let cents = 0;
  let sign = 1;
  let expectNumber = true;
  for (const tok of tokens) {
    if (tok === '+' || tok === '-') {
      if (!expectNumber) {
        sign = tok === '-' ? -1 : 1;
        expectNumber = true;
      } else if (tok === '-') {
        sign = -sign; // leading minus, or "5+-2"
      }
      continue;
    }
    if (!expectNumber) return null;
    // Work in cents so 2.03 + 3.56 is exactly 5.59, not 5.590000000000001.
    cents += sign * Math.round(parseFloat(tok) * 100);
    sign = 1;
    expectNumber = false;
  }
  if (expectNumber) return null; // ends with an operator, e.g. "5+"
  return cents / 100;
}

/** True when the text contains an operator between numbers (so it's worth showing "= result"). */
export function isCalculation(input: string): boolean {
  return /\d\s*[+\-−–]\s*[\d.,]/.test(input);
}
