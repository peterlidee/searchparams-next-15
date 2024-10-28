import isSortOrderT from '@/types/isSortOrderT';
import { SortOrderT } from '@/types/SortOrderT';

const DEFAULT_SORT_ORDER: SortOrderT = 'asc';

export default function validateSortOrder(
  value: string | string[] | undefined | null
) {
  if (!value) return DEFAULT_SORT_ORDER;
  if (Array.isArray(value)) return DEFAULT_SORT_ORDER;
  if (!isSortOrderT(value)) return DEFAULT_SORT_ORDER;
  return value;
}
