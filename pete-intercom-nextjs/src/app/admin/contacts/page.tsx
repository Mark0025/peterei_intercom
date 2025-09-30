import { getAllContacts, getContactStats } from '@/actions/contacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Users, MapPin, Tag, TrendingUp, Building2 } from 'lucide-react';

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

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Name/Email</th>
                  <th className="pb-3 font-medium">Pete ID</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Tags</th>
                  <th className="pb-3 font-medium">Last Seen</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-4">
                      <div>
                        <div className="font-medium">{contact.name || 'Unnamed'}</div>
                        <div className="text-sm text-muted-foreground">{contact.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      {contact.external_id ? (
                        <Badge variant="secondary">{contact.external_id}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4 text-sm">
                      {contact.companies?.companies?.[0]?.name || (
                        <span className="text-muted-foreground">No company</span>
                      )}
                    </td>
                    <td className="py-4 text-sm">
                      {contact.location?.city || contact.location?.country ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {contact.location?.city && contact.location?.country
                            ? `${contact.location.city}, ${contact.location.country}`
                            : contact.location?.country || contact.location?.city}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4">
                      {contact.tags?.data && contact.tags.data.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.data.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name || tag.id}
                            </Badge>
                          ))}
                          {contact.tags.data.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.tags.data.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4 text-sm">
                      {contact.last_seen_at ? (
                        new Date(contact.last_seen_at * 1000).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </td>
                    <td className="py-4">
                      <Link href={`/admin/contacts/${contact.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
