import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ListControles from '../ListControles';
import validateSortOrder from '@/lib/validateSortOrder';
jest.mock('@/lib/validateSortOrder');

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
jest.mock('next/navigation');

// add a return value to useSearchParams mock
const getMock: jest.Mock = jest.fn();
const toStringMock: jest.Mock = jest.fn();
(useSearchParams as jest.Mock).mockReturnValue({
  get: getMock,
  toString: toStringMock,
});

// add a return value to useRouter mock
const routerPushMock: jest.Mock = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: routerPushMock,
});

// add return value to usePathname mock
(usePathname as jest.Mock).mockReturnValue('example.com');

function setup() {
  (validateSortOrder as jest.Mock).mockReturnValue('asc');
  render(<ListControles />);
  const buttonAsc = screen.getByRole('button', { name: /sort ascending/i });
  const buttonDesc = screen.getByRole('button', { name: /sort descending/i });
  return { buttonAsc, buttonDesc };
}

describe('<ListControles /> component', () => {
  test('It renders', () => {
    const { buttonAsc, buttonDesc } = setup();
    expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
    expect(buttonAsc).toBeInTheDocument();
    expect(buttonDesc).toBeInTheDocument();
  });

  test('It correctly sets sortOrder', () => {
    setup();
    expect(getMock).toHaveBeenCalled();
    expect(validateSortOrder).toHaveBeenCalled();
    expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
  });

  test('It calls router.push with "sortOrder=asc" when "sort ascending" button is clicked', async () => {
    const user = userEvent.setup();
    const { buttonAsc } = setup();
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
  });

  test('It calls router.push with "sortOrder=desc" when "sort descending" button is clicked', async () => {
    const user = userEvent.setup();
    const { buttonDesc } = setup();
    await user.click(buttonDesc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=desc');
  });

  test('It overwrites current searchParam "sortOrder=asc" when button "sort ascending" is clicked', async () => {
    const user = userEvent.setup();
    (toStringMock as jest.Mock).mockReturnValue('sortOrder=asc');
    const { buttonAsc } = setup();
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
  });

  test('It overwrites current searchParam "sortOrder=desc" when button "sort ascending" is clicked', async () => {
    const user = userEvent.setup();
    (toStringMock as jest.Mock).mockReturnValue('sortOrder=desc');
    const { buttonAsc } = setup();
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
  });

  test('It preserves existing searchParams (except sortOrder) when button "sort ascending" is clicked', async () => {
    const user = userEvent.setup();
    (toStringMock as jest.Mock).mockReturnValue('foo=bar&foo=baz');
    const { buttonAsc } = setup();
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith(
      'example.com?foo=bar&foo=baz&sortOrder=asc'
    );
  });
});
