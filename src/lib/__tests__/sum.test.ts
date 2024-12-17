import sum from '../sum';

describe('function sum', () => {
  test('It returns the correct number', () => {
    expect(sum(1, 1)).toBe(2);
    expect(sum(1, 10)).toBe(11);
    expect(sum(3, 9)).toBe(12);
  });
});
