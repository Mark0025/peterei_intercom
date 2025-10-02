import Header from '@/components/header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </>
  );
}
