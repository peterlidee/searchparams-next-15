type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AsyncPage({ searchParams }: Props) {
  const currSearchParams = await searchParams;
  return (
    <>
      <h2 className='text-2xl font-bold mb-2'>async page ?foo=bar</h2>
      <div>searchParam foo is: {currSearchParams.foo}</div>
    </>
  );
}
