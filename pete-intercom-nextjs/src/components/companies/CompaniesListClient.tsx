'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Company } from '@/actions/companies';
import PeteAIChat from '@/components/PeteAIChat';

interface CompaniesListClientProps {
  companies: Company[];
}

export default function CompaniesListClient({ companies }: CompaniesListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter companies based on search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;

    const query = searchQuery.toLowerCase();
    return companies.filter(company => {
      return (
        company.name?.toLowerCase().includes(query) ||
        company.company_id?.toLowerCase().includes(query) ||
        company.website?.toLowerCase().includes(query) ||
        company.plan?.name?.toLowerCase().includes(query) ||
        company.tags?.tags?.some(t => t.name?.toLowerCase().includes(query)) ||
        company.industry?.toLowerCase().includes(query)
      );
    });
  }, [companies, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, Pete ID, plan, tags, website, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredCompanies.length} of {companies.length} companies
            </p>
          )}
        </CardContent>
      </Card>

      {/* PeteAI Chat */}
      <PeteAIChat contextHint="companies" />

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchQuery ? `Filtered Companies (${filteredCompanies.length})` : `All Companies (${companies.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Pete ID</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Users</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Tags</th>
                  <th className="pb-3 font-medium">Website</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-4 font-medium">{company.name}</td>
                    <td className="py-4">
                      {company.company_id ? (
                        <Badge variant="secondary">{company.company_id}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4">
                      {company.plan?.name ? (
                        <Badge variant="outline">{company.plan.name}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">No plan</span>
                      )}
                    </td>
                    <td className="py-4 text-sm">
                      {company.user_count || 0} users
                    </td>
                    <td className="py-4 text-sm">
                      {company.monthly_spend ? (
                        `$${company.monthly_spend.toLocaleString()}`
                      ) : (
                        <span className="text-muted-foreground">$0</span>
                      )}
                    </td>
                    <td className="py-4">
                      {company.tags?.tags && company.tags.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {company.tags.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name || tag.id}
                            </Badge>
                          ))}
                          {company.tags.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{company.tags.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4 text-sm">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {new URL(company.website).hostname}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-4">
                      <Link href={`/admin/companies/${company.id}`}>
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

          {filteredCompanies.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              No companies found matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
