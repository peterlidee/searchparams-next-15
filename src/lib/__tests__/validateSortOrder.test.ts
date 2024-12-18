import validateSortOrder from '../validateSortOrder';

describe('function validateSortOrder', () => {
  test('It returns "asc" when value is undefined', () => {
    expect(validateSortOrder(undefined)).toBe('asc');
  });
  test('It returns "asc" when value is "null"', () => {
    expect(validateSortOrder(null)).toBe('asc');
  });
  test('It returns "asc" when value is ""', () => {
    expect(validateSortOrder('')).toBe('asc');
  });
  test('It returns "asc" when value is empty array', () => {
    expect(validateSortOrder([])).toBe('asc');
  });
  test('It returns "asc" when value is array', () => {
    expect(validateSortOrder(['a', 'b', 'c'])).toBe('asc');
  });
  test('It returns "asc" when value is "asc"', () => {
    expect(validateSortOrder('asc')).toBe('asc');
  });
  test('It returns "desc" when value is "desc"', () => {
    expect(validateSortOrder('desc')).toBe('desc');
  });
});
