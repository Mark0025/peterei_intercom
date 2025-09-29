'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IntercomConversation } from '@/types';

interface KPIScoreCardsProps {
  conversations: IntercomConversation[];
}

export default function KPIScoreCards({ conversations }: KPIScoreCardsProps) {
  const now = Date.now();
  const msPerDay = 86400000;
  const msPerWeek = 7 * msPerDay;
  const msPerMonth = 30 * msPerDay;
  const msPerQuarter = 90 * msPerDay;
  const msPerYear = 365 * msPerDay;

  // Helper to calculate new tickets in time period
  const getNewTickets = (periodMs: number) => {
    const startTime = (now - periodMs) / 1000;
    return conversations.filter(c => c.created_at >= startTime).length;
  };

  // Helper to calculate closed tickets in time period
  const getClosedTickets = (periodMs: number) => {
    const startTime = (now - periodMs) / 1000;
    return conversations.filter(c =>
      c.state === 'closed' &&
      c.updated_at >= startTime
    ).length;
  };

  const kpis = [
    // New Tickets
    {
      label: 'New Today',
      value: getNewTickets(msPerDay),
      color: 'text-blue-600',
    },
    {
      label: 'New This Week',
      value: getNewTickets(msPerWeek),
      color: 'text-blue-600',
    },
    {
      label: 'New This Month',
      value: getNewTickets(msPerMonth),
      color: 'text-blue-600',
    },
    {
      label: 'New This Quarter',
      value: getNewTickets(msPerQuarter),
      color: 'text-blue-600',
    },
    {
      label: 'New This Year',
      value: getNewTickets(msPerYear),
      color: 'text-blue-600',
    },
    // Closed Tickets
    {
      label: 'Closed Today',
      value: getClosedTickets(msPerDay),
      color: 'text-green-600',
    },
    {
      label: 'Closed This Week',
      value: getClosedTickets(msPerWeek),
      color: 'text-green-600',
    },
    {
      label: 'Closed This Month',
      value: getClosedTickets(msPerMonth),
      color: 'text-green-600',
    },
    {
      label: 'Closed This Quarter',
      value: getClosedTickets(msPerQuarter),
      color: 'text-green-600',
    },
    {
      label: 'Closed This Year',
      value: getClosedTickets(msPerYear),
      color: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {kpi.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${kpi.color}`}>
              {kpi.value.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}