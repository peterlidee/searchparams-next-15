import { render, screen } from '@testing-library/react';
import List from '../List';

const listItems = ['a', 'c', 'd', 'b'];

function setup(sortOrder: 'asc' | 'desc' = 'asc') {
  render(<List items={listItems} sortOrder={sortOrder} />);
  const items = screen.getAllByRole('listitem');
  return { items };
}

describe('<List /> component', () => {
  test('It renders', () => {
    const { items } = setup();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(items).toHaveLength(4);
  });

  test('It renders asc when sortOrder is "asc"', () => {
    const { items } = setup();
    expect(items[0]).toHaveTextContent('a');
    expect(items[1]).toHaveTextContent('b');
    expect(items[2]).toHaveTextContent('c');
    expect(items[3]).toHaveTextContent('d');
  });

  test('It renders desc when sortOrder is "desc"', () => {
    const { items } = setup('desc');
    expect(items[3]).toHaveTextContent('a');
    expect(items[2]).toHaveTextContent('b');
    expect(items[1]).toHaveTextContent('c');
    expect(items[0]).toHaveTextContent('d');
  });
});
