'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { MapPin, Search } from 'lucide-react';
import type { Contact } from '@/actions/contacts';
import PeteAIChat from '@/components/PeteAIChat';

interface ContactsListClientProps {
  contacts: Contact[];
}

export default function ContactsListClient({ contacts }: ContactsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => {
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.external_id?.toLowerCase().includes(query) ||
        contact.companies?.companies?.some(c => c.name?.toLowerCase().includes(query)) ||
        contact.tags?.data?.some(t => t.name?.toLowerCase().includes(query)) ||
        contact.location?.city?.toLowerCase().includes(query) ||
        contact.location?.country?.toLowerCase().includes(query)
      );
    });
  }, [contacts, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, Pete ID, company, tags, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredContacts.length} of {contacts.length} contacts
            </p>
          )}
        </CardContent>
      </Card>

      {/* PeteAI Chat */}
      <PeteAIChat contextHint="contacts" />

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchQuery ? `Filtered Contacts (${filteredContacts.length})` : `All Contacts (${contacts.length})`}
          </CardTitle>
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
                {filteredContacts.map((contact) => (
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

          {filteredContacts.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              No contacts found matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
