import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ListPage from '../page';

// auto mock hooks
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

// generate async searchParams
async function generateSearchParams(value: {
  [key: string]: string | string[] | undefined;
}) {
  return value;
}

async function setup(
  searchParams: {
    [key: string]: string | string[] | undefined;
  },
  getMockReturnValue: string | string[] | undefined,
  searchParamsToStringValue: string = ''
) {
  getMock.mockReturnValue(getMockReturnValue);
  toStringMock.mockReturnValue(searchParamsToStringValue);
  const component = await ListPage({
    searchParams: generateSearchParams(searchParams),
  });
  render(component);
  const buttonAsc = screen.getByRole('button', { name: /sort ascending/i });
  const buttonDesc = screen.getByRole('button', { name: /sort descending/i });
  const list = screen.getByRole('list');
  const items = screen.getAllByRole('listitem');
  return { list, items, buttonAsc, buttonDesc };
}

describe('Integration test for /list route', () => {
  test('It renders', async () => {
    const { list, items, buttonAsc, buttonDesc } = await setup({}, 'asc');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /list/i
    );
    expect(screen.getByText(/current sort order:/i)).toBeInTheDocument();
    expect(buttonAsc).toBeInTheDocument();
    expect(buttonDesc).toBeInTheDocument();
    expect(list).toBeInTheDocument();
    expect(items).toHaveLength(4);
  });

  test('It renders by default asc when there is no searchParams.sortOrder', async () => {
    const { items } = await setup({}, undefined);
    expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
    expect(items[0]).toHaveTextContent(/apple/i);
    expect(items[1]).toHaveTextContent(/banana/i);
    expect(items[2]).toHaveTextContent(/cherry/i);
    expect(items[3]).toHaveTextContent(/lemon/i);
  });

  test('It renders by asc when searchParams.sortOrder is asc', async () => {
    const { items } = await setup({ sortOrder: 'asc' }, 'asc');
    expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
    expect(items[0]).toHaveTextContent(/apple/i);
    expect(items[1]).toHaveTextContent(/banana/i);
    expect(items[2]).toHaveTextContent(/cherry/i);
    expect(items[3]).toHaveTextContent(/lemon/i);
  });

  test('It renders by asc when searchParams.sortOrder is invalid (foobar)', async () => {
    const { items } = await setup({ sortOrder: 'foobar' }, 'foobar');
    expect(screen.getByText(/current sort order: asc/i)).toBeInTheDocument();
    expect(items[0]).toHaveTextContent(/apple/i);
    expect(items[1]).toHaveTextContent(/banana/i);
    expect(items[2]).toHaveTextContent(/cherry/i);
    expect(items[3]).toHaveTextContent(/lemon/i);
  });

  test('It renders by desc when searchParams.sortOrder is desc', async () => {
    const { items } = await setup({ sortOrder: 'desc' }, 'desc');
    expect(screen.getByText(/current sort order: desc/i)).toBeInTheDocument();
    expect(items[3]).toHaveTextContent(/apple/i);
    expect(items[2]).toHaveTextContent(/banana/i);
    expect(items[1]).toHaveTextContent(/cherry/i);
    expect(items[0]).toHaveTextContent(/lemon/i);
  });

  test('It calls router.push with "sortOrder=asc" when "sort ascending" button is clicked', async () => {
    const user = userEvent.setup();
    const { buttonAsc } = await setup({}, 'asc', 'sortOrder=asc');
    await user.click(buttonAsc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=asc');
  });

  test('It calls router.push with "sortOrder=desc" when "sort descending" button is clicked', async () => {
    const user = userEvent.setup();
    const { buttonDesc } = await setup({}, 'asc', 'sortOrder=asc');
    await user.click(buttonDesc);
    expect(routerPushMock).toHaveBeenCalledWith('example.com?sortOrder=desc');
  });
});
