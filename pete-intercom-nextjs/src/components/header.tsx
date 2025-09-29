import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <>
      <header className="flex justify-center items-center py-6 px-6">
        <Link href="/" className="inline-block">
          <Image
            src="/pete.png"
            alt="PETE Logo"
            width={64}
            height={64}
            className="hover:opacity-80 transition-opacity"
          />
        </Link>
      </header>
      <div className="h-2 bg-primary mb-8" />
    </>
  );
}
