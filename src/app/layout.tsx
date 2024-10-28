import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'searchParams in Next 15',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>
        <div className='p-2 flex flex-col items-center gap-6 text-lg'>
          <nav className='flex gap-3'>
            <Link href='/' className='text-blue-700 underline'>
              home
            </Link>
            <Link href='/asyncpage?foo=bar' className='text-blue-700 underline'>
              async page
            </Link>
            <Link href='/syncpage?foo=bar' className='text-blue-700 underline'>
              sync page
            </Link>
            <Link href='/list' className='text-blue-700 underline'>
              list
            </Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}
