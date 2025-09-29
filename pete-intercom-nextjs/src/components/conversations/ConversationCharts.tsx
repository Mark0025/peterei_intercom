'use client';

/**
 * Conversation analytics charts showing trends and distribution
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, DoughnutChart, formatTrendData, formatStateData } from '@/components/charts/ChartWrapper';

interface ConversationStats {
  total: number;
  open: number;
  closed: number;
  snoozed: number;
  priority: number;
  byDay: { date: string; count: number }[];
  byState: { state: string; count: number }[];
}

interface ConversationChartsProps {
  stats: ConversationStats;
}

export default function ConversationCharts({ stats }: ConversationChartsProps) {
  // Prepare trend data for line chart
  const trendData = formatTrendData(stats.byDay, 'Closed Conversations');

  // Prepare state distribution data for doughnut chart
  const stateData = formatStateData(stats.byState);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Summary Stats Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Overview Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Conversations</span>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Open</span>
            <span className="text-xl font-semibold text-yellow-600">{stats.open}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Closed</span>
            <span className="text-xl font-semibold text-green-600">{stats.closed}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Snoozed</span>
            <span className="text-xl font-semibold text-gray-600">{stats.snoozed}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-muted-foreground">Priority Conversations</span>
            <span className="text-xl font-semibold text-red-600">{stats.priority}</span>
          </div>
        </CardContent>
      </Card>

      {/* State Distribution Doughnut Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 State Distribution</CardTitle>
          <CardDescription>Current conversation states</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="w-full max-w-xs">
            <DoughnutChart data={stateData} />
          </div>
        </CardContent>
      </Card>

      {/* Closed Conversations Trend - Full Width */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">📉 Closed Conversations Trend (Last 30 Days)</CardTitle>
          <CardDescription>
            Daily count of conversations that were closed in the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <LineChart data={trendData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}