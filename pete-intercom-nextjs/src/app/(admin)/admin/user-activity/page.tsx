/**
 * User Activity Archive Dashboard
 *
 * View archived user events and page views to understand onboarding behavior.
 */

import { Suspense } from 'react';
import { archiveAllUserEvents, getContactArchivedEvents } from '@/actions/archive-events';
import { searchContacts } from '@/services/intercom';

export default async function UserActivityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          User Activity Archive
        </h1>
        <p className="text-gray-600 mt-2">
          Track user events and page views to understand onboarding behavior.
          Archives are preserved before Intercom deletes visitor data after 9 months.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Archive Status Card */}
        <Suspense fallback={<div>Loading...</div>}>
          <ArchiveStatusCard />
        </Suspense>

        {/* Manual Archive Trigger */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Archive</h2>
          <p className="text-gray-600 mb-4">
            Trigger a manual archive of all user events. This runs automatically daily.
          </p>
          <form action={archiveAllUserEvents}>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Run Archive Now
            </button>
          </form>
        </div>

        {/* Recent Activity */}
        <Suspense fallback={<div>Loading contacts...</div>}>
          <RecentActivityList />
        </Suspense>
      </div>
    </div>
  );
}

async function ArchiveStatusCard() {
  // Check for today's archive
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Archive Status</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4">
          <div className="text-sm text-gray-600">Last Archive</div>
          <div className="text-2xl font-bold text-purple-600">{dateStr}</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-sm text-gray-600">Retention Policy</div>
          <div className="text-2xl font-bold text-pink-600">90 days</div>
        </div>
        <div className="bg-white rounded-lg p-4">
          <div className="text-sm text-gray-600">Auto Archive</div>
          <div className="text-2xl font-bold text-green-600">Daily</div>
        </div>
      </div>
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Important:</strong> Intercom only provides events from the last 90 days.
          Visitor data is deleted after 9 months of inactivity. This archive preserves that data.
        </p>
      </div>
    </div>
  );
}

async function RecentActivityList() {
  const contacts = await searchContacts(undefined, undefined, false);
  const contactsWithActivity = contacts.slice(0, 10); // Show first 10

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Recent User Activity</h2>
      <div className="space-y-4">
        {contactsWithActivity.map(contact => (
          <Suspense key={contact.id} fallback={<div>Loading {contact.email}...</div>}>
            <ContactActivityRow contactId={contact.id} email={contact.email} name={contact.name} />
          </Suspense>
        ))}
      </div>
    </div>
  );
}

async function ContactActivityRow({
  contactId,
  email,
  name,
}: {
  contactId: string;
  email?: string;
  name?: string;
}) {
  const archives = await getContactArchivedEvents(contactId);
  const latestArchive = archives.length > 0 ? archives[archives.length - 1] : null;

  const totalEvents = latestArchive?.events.length || 0;
  const pageViews = latestArchive?.page_views.length || 0;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{name || email || 'Unknown'}</div>
          {email && <div className="text-sm text-gray-600">{email}</div>}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Events: {totalEvents}</div>
          <div className="text-sm text-gray-600">Page Views: {pageViews}</div>
        </div>
      </div>
      {latestArchive && (
        <div className="mt-2 text-xs text-gray-500">
          Last archived: {new Date(latestArchive.archived_at).toLocaleString()}
        </div>
      )}
      {archives.length > 1 && (
        <div className="mt-2 text-xs text-purple-600">
          {archives.length} total archives available
        </div>
      )}
    </div>
  );
}
