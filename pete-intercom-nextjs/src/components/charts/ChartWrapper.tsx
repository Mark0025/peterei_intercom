'use client';

/**
 * Reusable Chart.js wrapper components with shadcn/ui theming
 */

import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Theme colors matching Tailwind/shadcn
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: 'hsl(142.1 76.2% 36.3%)',
  warning: 'hsl(38 92% 50%)',
  danger: 'hsl(346.8 77.2% 49.8%)',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  background: 'hsl(var(--background))',
};

// Default chart options with theme
const getDefaultOptions = (title?: string): ChartOptions<'line' | 'bar' | 'pie' | 'doughnut'> => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: CHART_COLORS.muted,
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    title: title ? {
      display: true,
      text: title,
      color: CHART_COLORS.muted,
      font: {
        size: 16,
        weight: 'bold',
      },
      padding: {
        bottom: 20,
      },
    } : undefined,
    tooltip: {
      backgroundColor: CHART_COLORS.background,
      titleColor: CHART_COLORS.muted,
      bodyColor: CHART_COLORS.muted,
      borderColor: CHART_COLORS.border,
      borderWidth: 1,
      padding: 12,
      displayColors: true,
    },
  },
  scales: {
    x: {
      grid: {
        color: CHART_COLORS.border,
        display: false,
      },
      ticks: {
        color: CHART_COLORS.muted,
      },
    },
    y: {
      grid: {
        color: CHART_COLORS.border,
      },
      ticks: {
        color: CHART_COLORS.muted,
      },
    },
  },
});

interface LineChartProps {
  data: ChartData<'line'>;
  title?: string;
  options?: ChartOptions<'line'>;
}

export function LineChart({ data, title, options }: LineChartProps) {
  const chartOptions = {
    ...getDefaultOptions(title),
    ...options,
  };

  return <Line data={data} options={chartOptions} />;
}

interface BarChartProps {
  data: ChartData<'bar'>;
  title?: string;
  options?: ChartOptions<'bar'>;
}

export function BarChart({ data, title, options }: BarChartProps) {
  const chartOptions = {
    ...getDefaultOptions(title),
    ...options,
  };

  return <Bar data={data} options={chartOptions} />;
}

interface DoughnutChartProps {
  data: ChartData<'doughnut'>;
  title?: string;
  options?: ChartOptions<'doughnut'>;
}

export function DoughnutChart({ data, title, options }: DoughnutChartProps) {
  const chartOptions = {
    ...getDefaultOptions(title),
    ...options,
    scales: undefined, // Doughnut charts don't have scales
  };

  return <Doughnut data={data} options={chartOptions} />;
}

// Helper function to format conversation stats for line chart (trend over time)
export function formatTrendData(
  dataPoints: { date: string; count: number }[],
  label: string = 'Conversations'
) {
  return {
    labels: dataPoints.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label,
        data: dataPoints.map(d => d.count),
        borderColor: CHART_COLORS.primary,
        backgroundColor: `${CHART_COLORS.primary}33`, // 20% opacity
        fill: true,
        tension: 0.4,
      },
    ],
  };
}

// Helper function to format state distribution for doughnut chart
export function formatStateData(byState: { state: string; count: number }[]) {
  const stateColors = {
    open: CHART_COLORS.warning,
    closed: CHART_COLORS.success,
    snoozed: CHART_COLORS.secondary,
  };

  return {
    labels: byState.map(s => s.state.charAt(0).toUpperCase() + s.state.slice(1)),
    datasets: [
      {
        data: byState.map(s => s.count),
        backgroundColor: byState.map(s => stateColors[s.state as keyof typeof stateColors] || CHART_COLORS.muted),
        borderWidth: 2,
        borderColor: CHART_COLORS.background,
      },
    ],
  };
}

// Helper function to format bar chart data
export function formatBarData(
  labels: string[],
  data: number[],
  label: string = 'Count'
) {
  return {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor: CHART_COLORS.primary,
        borderColor: CHART_COLORS.primary,
        borderWidth: 1,
      },
    ],
  };
}

export { CHART_COLORS };