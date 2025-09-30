import { getAllContacts, getContactStats } from '@/actions/contacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Tag, TrendingUp, Building2 } from 'lucide-react';
import ContactsListClient from '@/components/contacts/ContactsListClient';

// Next.js 15: Opt into dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContactsPage() {
  // Fetch contacts and stats from cache
  const [contactsResult, statsResult] = await Promise.all([
    getAllContacts(false),
    getContactStats(),
  ]);

  // Handle errors
  if (!contactsResult.success || !statsResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all Intercom contacts
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {contactsResult.error || statsResult.error || 'Failed to load contact data'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contacts = contactsResult.data || [];
  const stats = statsResult.data!;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            {stats.total} contacts in your Intercom workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.withPeteId} with Pete ID
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.withCompanies / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tagged</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withTags}</div>
            <p className="text-xs text-muted-foreground">
              {stats.withSegments} in segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentlyActive}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Component with Search + PeteAI + Table */}
      <ContactsListClient contacts={contacts} />

      {/* Data Note */}
      <Card className="bg-slate-50 dark:bg-slate-900">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Data Source:</strong> Contacts are loaded from the Intercom cache (cache/intercom-cache.json).
            All fields including Pete user IDs, custom attributes, tags, and segments are available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
