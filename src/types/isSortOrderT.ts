import { SortOrderT } from './SortOrderT';

const VALID_SORT_OPTIONS: SortOrderT[] = ['asc', 'desc'];

export default function isSortOrderT(value: string): value is SortOrderT {
  return VALID_SORT_OPTIONS.includes(value as SortOrderT);
}
