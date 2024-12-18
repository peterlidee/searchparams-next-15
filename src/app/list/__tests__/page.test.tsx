import { screen, render } from '@testing-library/react';

import ListPage from '../page';

import validateSortOrder from '@/lib/validateSortOrder';
import List from '@/components/List';
import ListControles from '@/components/ListControles';

jest.mock('@/lib/validateSortOrder');
jest.mock('@/components/List');
jest.mock('@/components/ListControles');

async function generateSearchParams(value: {
  [key: string]: string | string[] | undefined;
}) {
  return value;
}

describe('<ListPage />', () => {
  test('It renders', async () => {
    const params = {
      sortOrder: 'asc',
    };
    const component = await ListPage({
      searchParams: generateSearchParams(params),
    });
    render(component);
    expect(validateSortOrder).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /list/i
    );
    expect(ListControles).toHaveBeenCalled();
    expect(List).toHaveBeenCalled();
  });

  test('searchParams is correctly passed down', async () => {
    const params = {
      sortOrder: 'asc',
    };
    const component = await ListPage({
      searchParams: generateSearchParams(params),
    });
    render(component);
    expect(validateSortOrder).toHaveBeenCalledWith('asc');
  });

  test('It calls validateSortOrder with undefined when searchParams.sortOrder does not exist', async () => {
    const params = {};
    const component = await ListPage({
      searchParams: generateSearchParams(params),
    });
    render(component);
    expect(validateSortOrder).toHaveBeenCalledWith(undefined);
  });
});
