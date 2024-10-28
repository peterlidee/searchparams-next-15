'use client';

import validateSortOrder from '@/lib/validateSortOrder';
import { SortOrderT } from '@/types/SortOrderT';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export default function ListControles() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // get validated sortOrder value
  const sortOrder = validateSortOrder(searchParams.get('sortOrder'));

  function handleSort(val: SortOrderT) {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortOrder', val);
    router.push(`${pathname}?${newParams.toString()}`);
  }
  return (
    <div>
      <div className='mb-2'>current sort order: {sortOrder}</div>
      <div className='flex gap-1'>
        <button
          className='bg-blue-700 text-white py-1 px-4 rounded-sm'
          onClick={() => handleSort('asc')}
        >
          sort ascending
        </button>
        <button
          className='bg-blue-700 text-white py-1 px-4 rounded-sm'
          onClick={() => handleSort('desc')}
        >
          sort descending
        </button>
      </div>
    </div>
  );
}
