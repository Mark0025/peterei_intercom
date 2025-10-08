'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onLinkClick?: (path: string) => void;
}

export function MarkdownRenderer({ content, className = '', onLinkClick }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Mermaid with support for hyperlinks
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose', // Allow clicks and hyperlinks in diagrams
      flowchart: {
        htmlLabels: true,
        useMaxWidth: true
      }
    });
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      // Render Mermaid diagrams after content update
      mermaid.contentLoaded();
    }
  }, [content]);

  // Handle internal doc link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('internal-doc-link')) {
        e.preventDefault();
        const docPath = target.getAttribute('data-doc-path');
        if (docPath && onLinkClick) {
          onLinkClick(docPath);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleClick);
      return () => container.removeEventListener('click', handleClick);
    }
  }, [onLinkClick]);

  // Parse markdown and extract Mermaid diagrams
  const renderContent = () => {
    const sections: JSX.Element[] = [];
    let currentIndex = 0;
    let keyCounter = 0;

    // Split content by Mermaid code blocks
    const mermaidRegex = /```mermaid\n([\s\S]+?)\n```/g;
    let match;

    while ((match = mermaidRegex.exec(content)) !== null) {
      // Add text before Mermaid diagram
      if (match.index > currentIndex) {
        const textBefore = content.substring(currentIndex, match.index);
        sections.push(
          <div
            key={`text-${keyCounter++}`}
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(textBefore) }}
          />
        );
      }

      // Add Mermaid diagram (sanitize syntax)
      const mermaidCode = sanitizeMermaidCode(match[1]);
      sections.push(
        <div key={`mermaid-${keyCounter++}`} className="mermaid-container my-6 p-4 bg-white rounded-lg border">
          <div className="mermaid">{mermaidCode}</div>
        </div>
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < content.length) {
      const textAfter = content.substring(currentIndex);
      sections.push(
        <div
          key={`text-${keyCounter++}`}
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(textAfter) }}
        />
      );
    }

    return sections;
  };

  return (
    <div ref={containerRef} className={`markdown-renderer ${className}`}>
      {renderContent()}

      <style jsx global>{`
        .markdown-renderer {
          line-height: 1.6;
          color: #333;
        }

        .markdown-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.3em;
        }

        .markdown-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1.3em;
          margin-bottom: 0.5em;
        }

        .markdown-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 1.2em;
          margin-bottom: 0.5em;
        }

        .markdown-content p {
          margin-bottom: 1em;
        }

        .markdown-content ul, .markdown-content ol {
          margin-left: 2em;
          margin-bottom: 1em;
        }

        .markdown-content li {
          margin-bottom: 0.5em;
        }

        .markdown-content code {
          background-color: #f4f4f4;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .markdown-content pre {
          background-color: #f4f4f4;
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
          margin-bottom: 1em;
        }

        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }

        .markdown-content blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1em;
          margin-left: 0;
          color: #666;
          font-style: italic;
        }

        .markdown-content a {
          color: #0066cc;
          text-decoration: none;
        }

        .markdown-content a:hover {
          text-decoration: underline;
        }

        .markdown-content .internal-doc-link {
          color: #0066cc;
          cursor: pointer;
        }

        .markdown-content .internal-doc-link:hover {
          text-decoration: underline;
          color: #0052a3;
        }

        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1em;
        }

        .markdown-content th,
        .markdown-content td {
          border: 1px solid #ddd;
          padding: 0.5em;
          text-align: left;
        }

        .markdown-content th {
          background-color: #f4f4f4;
          font-weight: bold;
        }

        .markdown-content hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 2em 0;
        }

        .mermaid-container {
          overflow-x: auto;
        }

        .mermaid {
          display: flex;
          justify-content: center;
          min-height: 100px;
        }

        .mermaid a,
        .mermaid .clickable {
          cursor: pointer;
          fill: #2563eb !important;
          color: #2563eb !important;
          text-decoration: underline;
        }

        .mermaid a:hover,
        .mermaid .clickable:hover {
          fill: #1d4ed8 !important;
          color: #1d4ed8 !important;
        }

        .mermaid .edgeLabel a {
          color: #2563eb !important;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

/**
 * Sanitizes Mermaid diagram code to fix common syntax issues
 */
function sanitizeMermaidCode(code: string): string {
  // Fix 1: Replace HTML <br/> tags with <br> (Mermaid syntax)
  code = code.replace(/<br\/>/g, '<br>');

  // Fix 2: Remove self-closing slashes from other tags if present
  code = code.replace(/<([^>]+)\/>/g, '<$1>');

  // Fix 3: Escape special characters in node labels that might break parsing
  // (Mermaid is sensitive to certain characters in labels)

  // Fix 4: Ensure proper spacing around arrows
  code = code.replace(/([A-Z])\s*-->\s*\|/g, '$1 -->|');
  code = code.replace(/\|\s*([A-Z])/g, '| $1');

  return code.trim();
}

/**
 * Basic markdown parser (supports common syntax)
 */
function parseMarkdown(text: string): string {
  // Headers
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/\_(.*?)\_/g, '<em>$1</em>');

  // Code blocks (non-mermaid)
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code)}</code></pre>`;
  });

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links - handle internal .md links differently from external links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    // Check if it's an internal doc link (.md file)
    if (url.endsWith('.md')) {
      // Remove leading ./ if present and add data attribute for click handling
      const cleanUrl = url.replace(/^\.\//, '');
      return `<a href="#" class="internal-doc-link" data-doc-path="${cleanUrl}">${linkText}</a>`;
    }
    // External link - open in new tab
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });

  // Lists
  text = text.replace(/^\* (.*$)/gim, '<li>$1</li>');
  text = text.replace(/^\- (.*$)/gim, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Line breaks
  text = text.replace(/\n\n/g, '</p><p>');
  text = text.replace(/^(?!<[hul])/gim, '<p>');
  text = text.replace(/(?<![hul]>)$/gim, '</p>');

  return text;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
