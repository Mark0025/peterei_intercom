'use client';

/**
 * Training Management Page
 *
 * Comprehensive admin interface for managing user training topics across all Intercom users.
 * Migrated from intercomApp/public/admin/peteTraining.html
 *
 * Features:
 * - View all training topics dropdown
 * - Bulk update training topics by audience
 * - Update single user's training topic
 * - Training topic library
 *
 * @see Issue #5: Convert Admin Scripts to TypeScript (Part 1)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { updateUserTrainingTopic, getUserTrainingTopic, bulkUpdateTrainingTopics, getAllUserTrainingTopics } from '@/actions/user-training';

export default function TrainingManagementPage() {
  // State for viewing all topics dropdown
  const [viewAllTopics, setViewAllTopics] = useState(false);
  const [allTopicsData, setAllTopicsData] = useState<Array<{
    id: string;
    email: string;
    name: string;
    topic: string | null;
    role: string;
    unsubscribed: boolean;
    spam: boolean;
    bounced: boolean;
  }>>([]);
  const [allTopicsLoading, setAllTopicsLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLogs, setShowDebugLogs] = useState(false);

  // State for bulk update
  const [bulkTopic, setBulkTopic] = useState('');
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // State for single user update
  const [userIdentifier, setUserIdentifier] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [singleResult, setSingleResult] = useState<string | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  // Predefined training topics
  const trainingTopics = [
    'Getting Started with Pete',
    'Using Custom Objects in Intercom',
    'Best Practices for Data Connectors',
    'Troubleshooting and Support',
    'Advanced Features & Workflows',
    'API Integration Guide',
  ];

  const handleViewAllTopics = async (isOpen: boolean, forceRefresh = false) => {
    setViewAllTopics(isOpen);
    if (isOpen && (allTopicsData.length === 0 || forceRefresh)) {
      setAllTopicsLoading(true);
      setDebugLogs(['🚀 Starting fetch...']);
      if (forceRefresh) {
        setDebugLogs(prev => [...prev, '🔄 Force refreshing data from server...']);
      }
      try {
        const startTime = Date.now();
        setDebugLogs(prev => [...prev, `⏱️ Start time: ${new Date(startTime).toLocaleTimeString()}`]);

        const result = await getAllUserTrainingTopics();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        setDebugLogs(prev => [...prev, `⏱️ End time: ${new Date(endTime).toLocaleTimeString()}`]);
        setDebugLogs(prev => [...prev, `⌛ Total duration: ${duration}s`]);

        if (result.success && result.users) {
          setAllTopicsData(result.users);
          setDebugLogs(prev => [...prev, `✅ Success! Retrieved ${result.users.length} users`]);
          setDebugLogs(prev => [...prev, `📊 With training: ${result.users.filter(u => u.topic).length}`]);
          setDebugLogs(prev => [...prev, `📊 Without training: ${result.users.filter(u => !u.topic).length}`]);
        } else {
          setDebugLogs(prev => [...prev, `❌ Error: ${result.error || 'Unknown error'}`]);
        }
      } catch (error) {
        console.error('Error fetching training topics:', error);
        setDebugLogs(prev => [...prev, `❌ Exception: ${error}`]);
      } finally {
        setAllTopicsLoading(false);
      }
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkTopic.trim() || !allTopicsData || allTopicsData.length === 0) return;

    setBulkLoading(true);
    setBulkResult(null);

    try {
      // Get all active users (role = 'user')
      const activeUsers = allTopicsData.filter(u => u.role === 'user');

      if (activeUsers.length === 0) {
        setBulkResult('❌ No active users found. Please load user data first.');
        setBulkLoading(false);
        return;
      }

      setBulkResult(`🔄 Updating ${activeUsers.length} active users...`);

      // Create updates for all active users using their IDs
      const updates = activeUsers.map(user => ({
        identifier: user.id, // Use Intercom contact ID
        topic: bulkTopic.trim(),
      }));

      const results = await bulkUpdateTrainingTopics(updates);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      let resultMessage = `✅ Bulk update complete!\n\n`;
      resultMessage += `📊 Total users: ${results.length}\n`;
      resultMessage += `✅ Successful: ${successCount}\n`;
      resultMessage += `❌ Failed: ${failCount}`;

      if (failCount > 0 && failCount <= 10) {
        resultMessage += `\n\n❌ Failed updates:`;
        results
          .filter(r => !r.success)
          .forEach(r => {
            const user = activeUsers.find(u => u.id === r.identifier);
            resultMessage += `\n• ${user?.email || r.identifier}: ${r.error}`;
          });
      } else if (failCount > 10) {
        resultMessage += `\n\n❌ ${failCount} users failed (too many to display)`;
      }

      setBulkResult(resultMessage);

      // Refresh the user list to show updated topics
      if (successCount > 0) {
        handleViewAllTopics(true, true); // Force refresh after bulk update
      }

    } catch (error) {
      setBulkResult(`❌ Error: ${error}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSingleUpdate = async () => {
    if (!userIdentifier.trim() || !newTopic.trim()) return;

    setSingleLoading(true);
    setSingleResult(null);

    try {
      const result = await updateUserTrainingTopic(userIdentifier.trim(), newTopic.trim());

      if (result.success) {
        setSingleResult(`✅ Successfully updated training topic for user ${result.userId}`);
        setUserIdentifier('');
        setNewTopic('');
      } else {
        setSingleResult(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setSingleResult(`❌ Error: ${error}`);
    } finally {
      setSingleLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Training Management</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage user training topics across all Intercom users
        </p>
      </div>

      {/* View All Training Topics Dropdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">📋 View All Training Topics</CardTitle>
          <CardDescription className="text-base">
            See current training topics for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Collapsible open={viewAllTopics} onOpenChange={handleViewAllTopics}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-11 text-base mb-4"
              >
                {viewAllTopics ? 'Hide All Topics' : 'Show All Topics'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4 space-y-4">
                {allTopicsLoading ? (
                  <div className="p-6 bg-muted rounded-lg">
                    <p className="text-center text-muted-foreground">Loading training topics data...</p>
                  </div>
                ) : allTopicsData.length === 0 ? (
                  <div className="p-6 bg-muted rounded-lg">
                    <p className="text-center text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <>
                    {/* KPI Summary Cards - Training */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                              <p className="text-3xl font-bold mt-2">{allTopicsData.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-2xl">👥</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">With Training</p>
                              <p className="text-3xl font-bold mt-2">
                                {allTopicsData.filter(u => u.topic).length}
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-2xl">✅</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Not Set</p>
                              <p className="text-3xl font-bold mt-2">
                                {allTopicsData.filter(u => !u.topic).length}
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-2xl">❌</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* User Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <Card>
                        <CardContent className="p-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Active Users</p>
                            <p className="text-2xl font-bold mt-1">
                              {allTopicsData.filter(u => u.role === 'user').length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Leads</p>
                            <p className="text-2xl font-bold mt-1">
                              {allTopicsData.filter(u => u.role === 'lead').length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div>
                            <p className="text-xs font-medium text-orange-600">Unsubscribed</p>
                            <p className="text-2xl font-bold mt-1 text-orange-600">
                              {allTopicsData.filter(u => u.unsubscribed).length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div>
                            <p className="text-xs font-medium text-red-600">Bounced/Spam</p>
                            <p className="text-2xl font-bold mt-1 text-red-600">
                              {allTopicsData.filter(u => u.bounced || u.spam).length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Topic Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Training Topic Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(() => {
                            const topicCounts = allTopicsData.reduce((acc, user) => {
                              const topic = user.topic || '(not set)';
                              acc[topic] = (acc[topic] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);

                            return Object.entries(topicCounts)
                              .sort(([, a], [, b]) => b - a)
                              .map(([topic, count]) => (
                                <div key={topic} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                                  <span className="font-medium">{topic}</span>
                                  <div className="flex items-center gap-3">
                                    <div className="text-sm text-muted-foreground">
                                      {((count / allTopicsData.length) * 100).toFixed(1)}%
                                    </div>
                                    <span className="font-bold min-w-[40px] text-right">{count}</span>
                                  </div>
                                </div>
                              ));
                          })()}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Debug Logs Dropdown */}
                    {debugLogs.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">🔍 Debug Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Collapsible open={showDebugLogs} onOpenChange={setShowDebugLogs}>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" className="w-full mb-3">
                                {showDebugLogs ? 'Hide Debug Logs' : 'Show Debug Logs'}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-4 bg-slate-900 rounded-lg text-green-400 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                                {debugLogs.map((log, idx) => (
                                  <div key={idx}>{log}</div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Bulk Update - Now First */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">📦 Bulk Update All Active Users</CardTitle>
          <CardDescription className="text-base">
            Set training topic for ALL active users (role: "user") at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {allTopicsData && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  📊 This will update <strong>{allTopicsData.filter(u => u.role === 'user').length} active users</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  (Users with role = "user", excluding leads and visitors)
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="bulk-topic" className="text-base">Training Topic for All Active Users</Label>
              <Input
                id="bulk-topic"
                placeholder="Enter training topic"
                value={bulkTopic}
                onChange={(e) => setBulkTopic(e.target.value)}
                className="h-11 text-base mt-2"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">Quick select a training topic:</p>
              <div className="flex gap-2 flex-wrap">
                {trainingTopics.map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="default"
                    onClick={() => setBulkTopic(topic)}
                    className="text-sm"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleBulkUpdate}
              disabled={bulkLoading || !bulkTopic.trim() || !allTopicsData}
              className="w-full h-12 text-base font-medium bg-orange-600 hover:bg-orange-700"
            >
              {bulkLoading ? 'Updating All Active Users...' : `Update All ${allTopicsData?.filter(u => u.role === 'user').length || 0} Active Users`}
            </Button>
            {bulkResult && (
              <div className={`p-5 rounded-lg ${bulkResult.startsWith('✅') ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
                <p className="whitespace-pre-wrap font-mono text-sm">{bulkResult}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Single User Update - Now Second */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">✏️ Update Single User</CardTitle>
          <CardDescription className="text-base">
            Update training topic for one user by email or ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div>
              <Label htmlFor="user-identifier" className="text-base">Email or User ID</Label>
              <Input
                id="user-identifier"
                placeholder="user@example.com or contact-id-123"
                value={userIdentifier}
                onChange={(e) => setUserIdentifier(e.target.value)}
                className="h-11 text-base mt-2"
              />
            </div>
            <div>
              <Label htmlFor="new-topic" className="text-base">New Training Topic</Label>
              <Input
                id="new-topic"
                placeholder="Enter training topic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSingleUpdate()}
                className="h-11 text-base mt-2"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">Quick select a training topic:</p>
              <div className="flex gap-2 flex-wrap">
                {trainingTopics.map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="default"
                    onClick={() => setNewTopic(topic)}
                    className="text-sm"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSingleUpdate}
              disabled={singleLoading || !userIdentifier.trim() || !newTopic.trim()}
              className="w-full h-12 text-base font-medium"
            >
              {singleLoading ? 'Updating...' : 'Update Training Topic'}
            </Button>
            {singleResult && (
              <div className={`p-5 rounded-lg ${singleResult.startsWith('✅') ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
                <p className="whitespace-pre-wrap text-base">{singleResult}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training Topics Library */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">📚 Training Topics Library</CardTitle>
          <CardDescription className="text-base">
            Standard training topics available for assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {trainingTopics.map((topic, index) => (
              <li key={index} className="flex items-center gap-3 text-base">
                <span className="text-primary font-semibold min-w-[80px]">Topic {index + 1}:</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
          <p className="text-base text-muted-foreground mt-6 p-4 bg-muted/50 rounded-lg">
            💡 You can type any custom training topic or use one of these standard options
          </p>
        </CardContent>
      </Card>
    </div>
  );
}