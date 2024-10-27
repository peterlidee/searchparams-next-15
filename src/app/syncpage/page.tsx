import { use } from 'react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function SyncPage({ searchParams }: Props) {
  const currSearchParams = use(searchParams);
  return (
    <>
      <h2 className='text-2xl font-bold mb-2'>sync page ?foo=bar</h2>
      <div>searchParam foo is: {currSearchParams.foo}</div>
    </>
  );
}
