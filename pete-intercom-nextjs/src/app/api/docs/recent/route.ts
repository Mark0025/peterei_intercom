/**
 * API Route: Recent Completed Issues
 *
 * Returns the 5 most recently completed issues for dashboard widget
 */

import { NextResponse } from 'next/server';
import { getRecentCompletions } from '@/actions/documentation';

export async function GET() {
  try {
    const completions = await getRecentCompletions();

    return NextResponse.json({
      success: true,
      completions,
    });
  } catch (error) {
    console.error('[RecentDocs] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent completions' },
      { status: 500 }
    );
  }
}
