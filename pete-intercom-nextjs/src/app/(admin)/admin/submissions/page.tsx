/**
 * Form Submissions Admin Page
 *
 * View all onboarding form submissions.
 * Protected by Clerk auth - admin only.
 */

import { getAllSubmissions, getSubmissionStats } from '@/actions/form-submissions';
import { Suspense } from 'react';

export default async function SubmissionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Form Submissions
        </h1>
        <p className="text-gray-600 mt-2">
          View all onboarding form submissions
        </p>
      </div>

      <Suspense fallback={<div>Loading statistics...</div>}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<div>Loading submissions...</div>}>
        <SubmissionsList />
      </Suspense>
    </div>
  );
}

async function StatsCards() {
  const stats = await getSubmissionStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">Total Submissions</div>
        <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">Last 24 Hours</div>
        <div className="text-3xl font-bold text-blue-600">{stats.last24Hours}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">Last Week</div>
        <div className="text-3xl font-bold text-green-600">{stats.lastWeek}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">Newest</div>
        <div className="text-sm font-medium text-gray-900">
          {stats.newest ? new Date(stats.newest).toLocaleDateString() : 'N/A'}
        </div>
      </div>
    </div>
  );
}

async function SubmissionsList() {
  const submissions = await getAllSubmissions();

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No submissions yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fields
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(submission.submittedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                  {submission.id.substring(0, 20)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {Object.keys(submission.answers).length} fields
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Suspense fallback={<span>Loading...</span>}>
                    <SubmissionDetails submission={submission} />
                  </Suspense>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubmissionDetails({ submission }: { submission: { id: string; answers: Record<string, string> } }) {
  return (
    <details>
      <summary className="cursor-pointer text-purple-600 hover:text-purple-800 font-medium">
        View Details
      </summary>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
        {Object.entries(submission.answers).map(([key, value]) => (
          <div key={key} className="border-b border-gray-200 pb-2">
            <div className="text-xs font-semibold text-gray-700 uppercase">{key}</div>
            <div className="text-sm text-gray-900 mt-1">{value}</div>
          </div>
        ))}
      </div>
    </details>
  );
}
