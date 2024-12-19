import isSortOrderT from '../isSortOrderT';

describe('isSortOrderT function', () => {
  test('It returns true when value is "asc"', () => {
    expect(isSortOrderT('asc')).toBe(true);
  });
  test('It returns true when value is "desc"', () => {
    expect(isSortOrderT('desc')).toBe(true);
  });
  test('It returns false when value is empty string', () => {
    expect(isSortOrderT('')).toBe(false);
  });
  test('It returns false when value is "foobar"', () => {
    expect(isSortOrderT('foobar')).toBe(false);
  });
});
