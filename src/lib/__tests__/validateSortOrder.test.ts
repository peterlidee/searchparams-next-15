import validateSortOrder from '../validateSortOrder';
import isSortOrderT from '@/types/isSortOrderT';
jest.mock('@/types/isSortOrderT');

describe('function validateSortOrder', () => {
  test('It returns "asc" when value is undefined', () => {
    (isSortOrderT as unknown as jest.Mock).mockReturnValue('asc');
    const result = validateSortOrder(undefined);
    expect(isSortOrderT).not.toHaveBeenCalled();
    expect(result).toBe('asc');
  });
  test('It returns "asc" when value is "null"', () => {
    (isSortOrderT as unknown as jest.Mock).mockReturnValue('asc');
    const result = validateSortOrder(null);
    expect(isSortOrderT).not.toHaveBeenCalled();
    expect(result).toBe('asc');
  });
  test('It returns "asc" when value is ""', () => {
    (isSortOrderT as unknown as jest.Mock).mockReturnValue('asc');
    const result = validateSortOrder('');
    expect(isSortOrderT).not.toHaveBeenCalled();
    expect(result).toBe('asc');
  });
  test('It returns "asc" when value is empty array', () => {
    (isSortOrderT as unknown as jest.Mock).mockReturnValue('asc');
    const result = validateSortOrder([]);
    expect(isSortOrderT).not.toHaveBeenCalled();
    expect(result).toBe('asc');
  });
  test('It returns "asc" when value is array', () => {
    (isSortOrderT as unknown as jest.Mock).mockReturnValue('asc');
    const result = validateSortOrder(['a', 'b', 'c']);
    expect(isSortOrderT).not.toHaveBeenCalled();
    expect(result).toBe('asc');
  });
  test('It returns "asc" when value is "asc"', () => {
    (isSortOrderT as unknown as jest.Mock).mockReturnValue('asc');
    const result = validateSortOrder('asc');
    expect(isSortOrderT).toHaveBeenCalledWith('asc');
    expect(result).toBe('asc');
  });
  test('It returns "desc" when value is "desc"', () => {
    (isSortOrderT as unknown as jest.Mock).mockReturnValue('desc');
    const result = validateSortOrder('desc');
    expect(isSortOrderT).toHaveBeenCalledWith('desc');
    expect(result).toBe('desc');
  });
});
