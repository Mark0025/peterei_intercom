/**
 * Conversation Flow Mermaid Diagram Generator
 *
 * Generates Mermaid diagrams showing:
 * - Customer journey through conversations
 * - Resolution paths (successful vs. failed)
 * - Escalation points
 * - Common touchpoints and decision trees
 */

import type { IntercomConversation } from '@/types';
import type {
  ConversationFlowDiagram,
  MermaidNode,
  MermaidEdge,
  ConversationFilters
} from '@/types/conversation-analysis';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize text for Mermaid syntax
 */
function sanitizeForMermaid(text: string): string {
  return text
    .replace(/[\[\](){}]/g, '') // Remove brackets and parentheses
    .replace(/["']/g, '') // Remove quotes
    .replace(/[^\w\s-]/g, ' ') // Replace special chars with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 50); // Limit length
}

/**
 * Generate node ID
 */
function generateNodeId(label: string, index?: number): string {
  const sanitized = label.replace(/[^a-zA-Z0-9]/g, '_');
  return index !== undefined ? `${sanitized}_${index}` : sanitized;
}

// ============================================================================
// Diagram Generators
// ============================================================================

/**
 * Generate customer journey map based on conversation tags
 */
export function generateCustomerJourneyDiagram(
  conversations: IntercomConversation[],
  category?: string
): ConversationFlowDiagram {
  const title = category
    ? `Customer Journey - ${category}`
    : 'Customer Journey - All Conversations';

  // Collect common paths based on tags
  const pathMap = new Map<string, { next: Map<string, number>; count: number }>();

  conversations.forEach(convo => {
    const tags = convo.tags?.tags?.map(t => t.name) || [];
    if (category && !tags.includes(category)) return;

    for (let i = 0; i < tags.length - 1; i++) {
      const current = tags[i];
      const next = tags[i + 1];

      if (!pathMap.has(current)) {
        pathMap.set(current, { next: new Map(), count: 0 });
      }
      const path = pathMap.get(current)!;
      path.count++;
      path.next.set(next, (path.next.get(next) || 0) + 1);
    }
  });

  // Build nodes and edges
  const nodes: MermaidNode[] = [
    { id: 'start', label: 'Customer Inquiry', type: 'start' }
  ];

  const edges: MermaidEdge[] = [];
  let nodeIndex = 0;

  // Get most common paths
  const sortedPaths = Array.from(pathMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8); // Top 8 most common paths

  sortedPaths.forEach(([tag, data]) => {
    const nodeId = generateNodeId(tag, nodeIndex++);
    nodes.push({
      id: nodeId,
      label: sanitizeForMermaid(tag),
      type: 'process'
    });

    // Add edges from previous nodes
    if (nodes.length === 2) {
      edges.push({
        from: 'start',
        to: nodeId,
        label: `${data.count} conversations`
      });
    }

    // Add edges to next nodes
    const sortedNext = Array.from(data.next.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2); // Top 2 next steps

    sortedNext.forEach(([nextTag, count]) => {
      const existingNode = nodes.find(n => n.label === sanitizeForMermaid(nextTag));
      const nextNodeId = existingNode?.id || generateNodeId(nextTag, nodeIndex++);

      if (!existingNode) {
        nodes.push({
          id: nextNodeId,
          label: sanitizeForMermaid(nextTag),
          type: 'process'
        });
      }

      edges.push({
        from: nodeId,
        to: nextNodeId,
        label: `${count}`
      });
    });
  });

  // Add end node
  nodes.push({ id: 'end', label: 'Resolution', type: 'end' });

  // Connect last nodes to end
  const terminalNodes = nodes.filter(n =>
    n.type === 'process' && !edges.some(e => e.from === n.id)
  );
  terminalNodes.forEach(node => {
    edges.push({ from: node.id, to: 'end' });
  });

  // Generate Mermaid code
  const mermaidCode = buildMermaidCode(title, nodes, edges);

  return { title, nodes, edges, mermaidCode };
}

/**
 * Generate resolution path diagram (success vs. failure)
 */
export function generateResolutionPathDiagram(
  conversations: IntercomConversation[],
  category?: string
): ConversationFlowDiagram {
  const title = category
    ? `Resolution Paths - ${category}`
    : 'Resolution Paths - All Conversations';

  const filtered = category
    ? conversations.filter(c => c.tags?.tags?.some(t => t.name === category))
    : conversations;

  // Categorize conversations
  const successful = filtered.filter(c =>
    c.state === 'closed' &&
    c.statistics?.time_to_first_close &&
    c.statistics.time_to_first_close < 86400 // < 24 hours
  );

  const slow = filtered.filter(c =>
    c.state === 'closed' &&
    c.statistics?.time_to_first_close &&
    c.statistics.time_to_first_close >= 86400 &&
    c.statistics.time_to_first_close < 172800 // 24-48 hours
  );

  const failed = filtered.filter(c =>
    c.state === 'open' ||
    (c.statistics?.time_to_first_close && c.statistics.time_to_first_close >= 172800) // > 48 hours
  );

  // Build diagram
  const nodes: MermaidNode[] = [
    { id: 'start', label: 'Conversation Start', type: 'start' },
    { id: 'triage', label: 'Initial Triage', type: 'decision' },
    { id: 'quick_res', label: `Quick Resolution (${successful.length})`, type: 'process', success: true },
    { id: 'slow_res', label: `Slow Resolution (${slow.length})`, type: 'process', success: false },
    { id: 'escalation', label: `Escalation (${failed.length})`, type: 'process', success: false },
    { id: 'resolved', label: 'Resolved', type: 'end', success: true },
    { id: 'ongoing', label: 'Ongoing', type: 'end', success: false }
  ];

  const edges: MermaidEdge[] = [
    { from: 'start', to: 'triage' },
    { from: 'triage', to: 'quick_res', label: `${Math.round((successful.length / filtered.length) * 100)}%` },
    { from: 'triage', to: 'slow_res', label: `${Math.round((slow.length / filtered.length) * 100)}%` },
    { from: 'triage', to: 'escalation', label: `${Math.round((failed.length / filtered.length) * 100)}%` },
    { from: 'quick_res', to: 'resolved' },
    { from: 'slow_res', to: 'resolved' },
    { from: 'escalation', to: 'ongoing' }
  ];

  const mermaidCode = buildMermaidCode(title, nodes, edges);

  return { title, nodes, edges, mermaidCode };
}

/**
 * Generate escalation flowchart
 */
export function generateEscalationFlowchart(
  conversations: IntercomConversation[],
  category?: string
): ConversationFlowDiagram {
  const title = category
    ? `Escalation Triggers - ${category}`
    : 'Escalation Triggers - All Conversations';

  const escalated = conversations.filter(c =>
    c.tags?.tags?.some(t => t.name.toLowerCase().includes('escalation'))
  );

  const filtered = category
    ? escalated.filter(c => c.tags?.tags?.some(t => t.name === category))
    : escalated;

  // Analyze escalation triggers
  const triggerMap = new Map<string, number>();

  filtered.forEach(convo => {
    const tags = convo.tags?.tags?.map(t => t.name) || [];
    tags.forEach(tag => {
      if (!tag.toLowerCase().includes('escalation')) {
        triggerMap.set(tag, (triggerMap.get(tag) || 0) + 1);
      }
    });
  });

  const topTriggers = Array.from(triggerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Build diagram
  const nodes: MermaidNode[] = [
    { id: 'start', label: 'Conversation', type: 'start' },
    { id: 'check', label: 'Issue Assessment', type: 'decision' }
  ];

  const edges: MermaidEdge[] = [
    { from: 'start', to: 'check' }
  ];

  topTriggers.forEach(([trigger, count], index) => {
    const nodeId = `trigger_${index}`;
    nodes.push({
      id: nodeId,
      label: `${sanitizeForMermaid(trigger)} (${count})`,
      type: 'process',
      success: false
    });

    edges.push({
      from: 'check',
      to: nodeId,
      label: `${Math.round((count / filtered.length) * 100)}%`
    });

    edges.push({
      from: nodeId,
      to: 'escalated'
    });
  });

  nodes.push({ id: 'escalated', label: 'Escalated to Dev Team', type: 'end', success: false });

  const mermaidCode = buildMermaidCode(title, nodes, edges);

  return { title, nodes, edges, mermaidCode };
}

/**
 * Generate category-specific pattern diagram
 */
export function generateCategoryPatternDiagram(
  conversations: IntercomConversation[],
  category: string
): ConversationFlowDiagram {
  const title = `Conversation Patterns - ${category}`;

  const filtered = conversations.filter(c =>
    c.tags?.tags?.some(t => t.name.toLowerCase().includes(category.toLowerCase()))
  );

  // Analyze states and resolution times
  const open = filtered.filter(c => c.state === 'open');
  const closed = filtered.filter(c => c.state === 'closed');
  const withRating = filtered.filter(c => c.conversation_rating);
  const escalated = filtered.filter(c =>
    c.tags?.tags?.some(t => t.name.toLowerCase().includes('escalation'))
  );

  const avgRating = withRating.length > 0
    ? Math.round(withRating.reduce((acc, c) => acc + (c.conversation_rating?.rating || 0), 0) / withRating.length)
    : 0;

  // Build diagram
  const nodes: MermaidNode[] = [
    { id: 'start', label: `${category} Query`, type: 'start' },
    { id: 'route', label: 'Routing', type: 'decision' },
    { id: 'resolved', label: `Resolved (${closed.length})`, type: 'process', success: true },
    { id: 'ongoing', label: `In Progress (${open.length})`, type: 'process', success: false },
    { id: 'escalated', label: `Escalated (${escalated.length})`, type: 'process', success: false },
    { id: 'feedback', label: `Avg Rating: ${avgRating}/5`, type: 'end', success: avgRating >= 4 }
  ];

  const edges: MermaidEdge[] = [
    { from: 'start', to: 'route' },
    { from: 'route', to: 'resolved', label: `${Math.round((closed.length / filtered.length) * 100)}%` },
    { from: 'route', to: 'ongoing', label: `${Math.round((open.length / filtered.length) * 100)}%` },
    { from: 'route', to: 'escalated', label: `${Math.round((escalated.length / filtered.length) * 100)}%` },
    { from: 'resolved', to: 'feedback' },
    { from: 'ongoing', to: 'feedback' }
  ];

  const mermaidCode = buildMermaidCode(title, nodes, edges);

  return { title, nodes, edges, mermaidCode };
}

// ============================================================================
// Mermaid Code Builder
// ============================================================================

/**
 * Build Mermaid code from nodes and edges
 */
function buildMermaidCode(title: string, nodes: MermaidNode[], edges: MermaidEdge[]): string {
  let code = `graph TD\n`;

  // Add title as comment
  code += `    %% ${title}\n\n`;

  // Add nodes
  nodes.forEach(node => {
    const shape = getNodeShape(node.type);
    const style = node.success !== undefined
      ? (node.success ? ':::success' : ':::warning')
      : '';

    code += `    ${node.id}${shape[0]}${node.label}${shape[1]}${style}\n`;
  });

  code += '\n';

  // Add edges
  edges.forEach(edge => {
    const label = edge.label ? `|${edge.label}|` : '';
    code += `    ${edge.from} --${label}--> ${edge.to}\n`;
  });

  // Add styles
  code += `\n    classDef success fill:#d4edda,stroke:#28a745,stroke-width:2px\n`;
  code += `    classDef warning fill:#fff3cd,stroke:#ffc107,stroke-width:2px\n`;

  return `\`\`\`mermaid\n${code}\`\`\``;
}

/**
 * Get Mermaid shape syntax for node type
 */
function getNodeShape(type: string): [string, string] {
  switch (type) {
    case 'start':
    case 'end':
      return ['([', '])'];
    case 'decision':
      return ['{', '}'];
    case 'process':
    default:
      return ['[', ']'];
  }
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate conversation flow diagram based on type
 */
export function generateConversationFlowDiagram(
  conversations: IntercomConversation[],
  type: 'journey' | 'resolution' | 'escalation' | 'category' = 'resolution',
  category?: string
): string {
  let diagram: ConversationFlowDiagram;

  switch (type) {
    case 'journey':
      diagram = generateCustomerJourneyDiagram(conversations, category);
      break;
    case 'escalation':
      diagram = generateEscalationFlowchart(conversations, category);
      break;
    case 'category':
      diagram = category
        ? generateCategoryPatternDiagram(conversations, category)
        : generateResolutionPathDiagram(conversations);
      break;
    case 'resolution':
    default:
      diagram = generateResolutionPathDiagram(conversations, category);
      break;
  }

  return diagram.mermaidCode;
}
