import { evalAmount, isCalculation } from './amount-expr';

describe('evalAmount', () => {
  it('reads plain numbers', () => {
    expect(evalAmount('12')).toBe(12);
    expect(evalAmount('12.5')).toBe(12.5);
    expect(evalAmount('.5')).toBe(0.5);
    expect(evalAmount('3,20')).toBe(3.2);
    expect(evalAmount('12.')).toBe(12);
  });

  it('adds and subtracts without float errors', () => {
    expect(evalAmount('2.03+3.56')).toBe(5.59);
    expect(evalAmount('0.1+0.2')).toBe(0.3);
    expect(evalAmount('10 - 2,5 + 1')).toBe(8.5);
    expect(evalAmount('5+-2')).toBe(3);
    expect(evalAmount('5 − 1')).toBe(4);
    expect(evalAmount('-3+10')).toBe(7);
  });

  it('rejects invalid input', () => {
    for (const bad of ['', ' ', '5+', '+', '2..3', 'abc', '5*2', '1.2.3']) {
      expect(evalAmount(bad), bad).toBeNull();
    }
  });

  it('detects calculations', () => {
    expect(isCalculation('2+3')).toBe(true);
    expect(isCalculation('12.5')).toBe(false);
    expect(isCalculation('-5')).toBe(false);
  });
});
