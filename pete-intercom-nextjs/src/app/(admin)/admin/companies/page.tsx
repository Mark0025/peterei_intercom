import { getAllCompanies, getCompanyStats } from '@/actions/companies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, Users, Tag, TrendingUp, DollarSign } from 'lucide-react';
import CompaniesListClient from '@/components/companies/CompaniesListClient';

// Next.js 15: Opt into dynamic rendering for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompaniesPage() {
  // Fetch companies and stats from cache
  const [companiesResult, statsResult] = await Promise.all([
    getAllCompanies(false),
    getCompanyStats(),
  ]);

  // Handle errors
  if (!companiesResult.success || !statsResult.success) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all Intercom companies
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {companiesResult.error || statsResult.error || 'Failed to load company data'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const companies = companiesResult.data || [];
  const stats = statsResult.data!;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-1">
            {stats.total} companies in your Intercom workspace
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">With Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.withUsers / stats.total) * 100).toFixed(1)}% of total
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
            <CardTitle className="text-sm font-medium">With Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withPlan}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.withPlan / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Component with Search + PeteAI + Table */}
      <CompaniesListClient companies={companies} />

      {/* Data Note */}
      <Card className="bg-slate-50 dark:bg-slate-900">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Data Source:</strong> Companies are loaded from the Intercom cache (cache/intercom-cache.json).
            All fields including Pete company IDs, custom attributes, tags, segments, and plans are available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
