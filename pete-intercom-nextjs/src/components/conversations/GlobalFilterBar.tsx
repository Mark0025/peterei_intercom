'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, StickyNote } from 'lucide-react';
import type { IntercomConversation } from '@/types';

interface GlobalFilterBarProps {
  conversations: IntercomConversation[];
  noteMetadata: Record<string, {
    hasNotes: boolean;
    hasJonNotes: boolean;
    hasMarkNotes: boolean;
  }>;
  onFilterChange: (filtered: IntercomConversation[]) => void;
}

export default function GlobalFilterBar({ conversations, noteMetadata, onFilterChange }: GlobalFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Note filter checkboxes - Why: Enable filtering by team review status
  const [showWithNotes, setShowWithNotes] = useState(false);
  const [showJonNotes, setShowJonNotes] = useState(false);
  const [showMarkNotes, setShowMarkNotes] = useState(false);

  // Extract unique topics from conversation custom_attributes
  const availableTopics = useMemo(() => {
    const topics = new Set<string>();
    conversations.forEach(conv => {
      const topic = conv.custom_attributes?.topic || conv.custom_attributes?.Topic;
      if (topic && typeof topic === 'string') {
        topics.add(topic);
      }
    });
    return Array.from(topics).sort();
  }, [conversations]);

  // Apply filters whenever they change - using useEffect to avoid setState during render
  useEffect(() => {
    let filtered = [...conversations];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.title?.toLowerCase().includes(search) ||
        conv.id.toLowerCase().includes(search) ||
        conv.tags?.tags.some(tag => tag.name.toLowerCase().includes(search)) ||
        conv.source?.subject?.toLowerCase().includes(search)
      );
    }

    // Topic filter
    if (topicFilter !== 'all') {
      filtered = filtered.filter(conv => {
        const topic = conv.custom_attributes?.topic || conv.custom_attributes?.Topic;
        return topic === topicFilter;
      });
    }

    // State filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(conv => conv.state === stateFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(conv => conv.priority === priorityFilter);
    }

    // Note filters - Why: Filter by team review status using cached metadata
    // Strategy: Use metadata map for fast lookups without fetching full thread data
    if (showWithNotes) {
      filtered = filtered.filter(conv => noteMetadata[conv.id]?.hasNotes);
    }

    if (showJonNotes) {
      filtered = filtered.filter(conv => noteMetadata[conv.id]?.hasJonNotes);
    }

    if (showMarkNotes) {
      filtered = filtered.filter(conv => noteMetadata[conv.id]?.hasMarkNotes);
    }

    onFilterChange(filtered);
  }, [conversations, searchTerm, topicFilter, stateFilter, priorityFilter, showWithNotes, showJonNotes, showMarkNotes, noteMetadata, onFilterChange]);

  return (
    <div className="bg-muted/30 border-b p-4 mb-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations by title, ID, subject, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          {/* Topic Filter */}
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background min-w-[150px]"
          >
            <option value="all">All Topics</option>
            {availableTopics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All States</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="snoozed">Snoozed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Priorities</option>
            <option value="priority">Priority</option>
            <option value="not_priority">Normal</option>
          </select>
        </div>

        {/* Note Filter Checkboxes - Why: Enable filtering by team review status */}
        <div className="flex items-center gap-4 p-3 bg-background border rounded-md">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StickyNote className="h-4 w-4" />
            <span className="font-medium">Notes:</span>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-has-notes"
              checked={showWithNotes}
              onCheckedChange={(checked) => setShowWithNotes(checked === true)}
            />
            <Label
              htmlFor="filter-has-notes"
              className="text-sm font-normal cursor-pointer"
            >
              Has Notes
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-jon-notes"
              checked={showJonNotes}
              onCheckedChange={(checked) => setShowJonNotes(checked === true)}
            />
            <Label
              htmlFor="filter-jon-notes"
              className="text-sm font-normal cursor-pointer"
            >
              Jon&apos;s Notes
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-mark-notes"
              checked={showMarkNotes}
              onCheckedChange={(checked) => setShowMarkNotes(checked === true)}
            />
            <Label
              htmlFor="filter-mark-notes"
              className="text-sm font-normal cursor-pointer"
            >
              Mark&apos;s Notes
            </Label>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || topicFilter !== 'all' || stateFilter !== 'all' || priorityFilter !== 'all' || showWithNotes || showJonNotes || showMarkNotes) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-background rounded border">
                Search: &quot;{searchTerm}&quot;
              </span>
            )}
            {topicFilter !== 'all' && (
              <span className="px-2 py-1 bg-background rounded border">
                Topic: {topicFilter}
              </span>
            )}
            {stateFilter !== 'all' && (
              <span className="px-2 py-1 bg-background rounded border">
                State: {stateFilter}
              </span>
            )}
            {priorityFilter !== 'all' && (
              <span className="px-2 py-1 bg-background rounded border">
                Priority: {priorityFilter}
              </span>
            )}
            {showWithNotes && (
              <span className="px-2 py-1 bg-background rounded border">
                Has Notes
              </span>
            )}
            {showJonNotes && (
              <span className="px-2 py-1 bg-background rounded border">
                Jon&apos;s Notes
              </span>
            )}
            {showMarkNotes && (
              <span className="px-2 py-1 bg-background rounded border">
                Mark&apos;s Notes
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setTopicFilter('all');
                setStateFilter('all');
                setPriorityFilter('all');
                setShowWithNotes(false);
                setShowJonNotes(false);
                setShowMarkNotes(false);
              }}
              className="px-2 py-1 text-primary hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}