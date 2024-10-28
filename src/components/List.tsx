import { SortOrderT } from '@/types/SortOrderT';

type Props = {
  items: string[];
  sortOrder: SortOrderT;
};

const SORT_CALLBACKS = {
  asc: (a: string, b: string) => (a > b ? 1 : -1),
  desc: (a: string, b: string) => (a < b ? 1 : -1),
};

export default function List({ items, sortOrder }: Props) {
  const sortedItems = items.sort(SORT_CALLBACKS[sortOrder]);
  return (
    <ul className='list-disc'>
      {sortedItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
