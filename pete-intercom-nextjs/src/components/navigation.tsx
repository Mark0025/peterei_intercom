'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function Navigation() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // Check if user is an admin (@peterei.com email)
  const isAdmin = isLoaded && user?.primaryEmailAddress?.emailAddress?.endsWith('@peterei.com');

  const navStyle = {
    background: '#2d72d2',
    padding: '12px 0 8px 0',
    textAlign: 'center' as const,
    marginBottom: '32px'
  };

  const linkStyle = {
    color: '#fff',
    margin: '0 18px',
    textDecoration: 'none',
    fontWeight: 'bold'
  };

  const activeLinkStyle = {
    ...linkStyle,
    textDecoration: 'underline'
  };

  return (
    <nav style={navStyle}>
      <Link
        href="/"
        style={pathname === '/' ? activeLinkStyle : linkStyle}
      >
        Home
      </Link>
      <Link
        href="/popout"
        style={pathname.startsWith('/popout') ? activeLinkStyle : linkStyle}
      >
        Onboarding
      </Link>
      <Link
        href="/peteai"
        style={pathname.startsWith('/peteai') ? activeLinkStyle : linkStyle}
      >
        PeteAI
      </Link>
      {isAdmin && (
        <>
          <Link
            href="/admin"
            style={pathname.startsWith('/admin') ? activeLinkStyle : linkStyle}
          >
            Admin
          </Link>
          <Link
            href="/whatsworking"
            style={pathname.startsWith('/whatsworking') ? activeLinkStyle : linkStyle}
          >
            What&apos;s Working
          </Link>
        </>
      )}
      <Link
        href="/help"
        style={pathname.startsWith('/help') ? activeLinkStyle : linkStyle}
      >
        Help Center
      </Link>
    </nav>
  );
}