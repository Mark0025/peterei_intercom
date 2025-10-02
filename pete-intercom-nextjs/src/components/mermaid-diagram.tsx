'use client';

import { useEffect, useRef } from 'react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

/**
 * Sanitizes Mermaid diagram code to fix common syntax issues
 */
function sanitizeMermaidCode(code: string): string {
  // Fix 1: Replace HTML <br/> tags with <br> (Mermaid syntax)
  code = code.replace(/<br\/>/g, '<br>');

  // Fix 2: Remove self-closing slashes from other tags if present
  code = code.replace(/<([^>]+)\/>/g, '<$1>');

  // Fix 3: Ensure proper spacing around arrows
  code = code.replace(/([A-Z])\s*-->\s*\|/g, '$1 -->|');
  code = code.replace(/\|\s*([A-Z])/g, '| $1');

  return code.trim();
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default || mermaidModule;

        if (!mermaid) {
          console.error('Mermaid module not found');
          return;
        }

        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Sanitize Mermaid code to fix common syntax issues
        const sanitizedChart = sanitizeMermaidCode(chart);

        try {
          const { svg } = await mermaid.render(id, sanitizedChart);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `<pre style="color:red" class="text-sm p-4">Mermaid error: ${error instanceof Error ? error.message : 'Unknown error'}</pre>`;
          }
        }
      } catch (error) {
        console.error('Failed to load Mermaid:', error);
      }
    };

    renderDiagram();
  }, [chart]);

  return <div ref={containerRef} className={className} />;
}