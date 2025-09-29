import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        padding: '18px 0 8px 0'
      }}>
        <Link href="/" style={{ display: 'inline-block' }}>
          <Image 
            src="/pete.png" 
            alt="PETE Logo" 
            width={48} 
            height={48}
            style={{ verticalAlign: 'middle' }}
          />
        </Link>
      </header>
      <div style={{
        height: '10px',
        background: '#2d72d2',
        marginBottom: '32px'
      }} />
    </>
  );
}
