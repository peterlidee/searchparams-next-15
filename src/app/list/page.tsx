import List from '@/components/List';
import ListControles from '@/components/ListControles';
import validateSortOrder from '@/lib/validateSortOrder';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const ITEMS = ['apple', 'banana', 'cherry', 'lemon'];

export default async function ListPage({ searchParams }: Props) {
  const currSearchParams = await searchParams;
  const sortOrder = validateSortOrder(currSearchParams.sortOrder);
  return (
    <>
      <h2 className='text-2xl font-bold mb-2'>List</h2>
      <ListControles />
      <List items={ITEMS} sortOrder={sortOrder} />
    </>
  );
}
