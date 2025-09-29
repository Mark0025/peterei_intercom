'use client';

import { useEffect } from 'react';

interface MarkdownRendererProps {
  htmlContent: string;
}

export default function MarkdownRenderer({ htmlContent }: MarkdownRendererProps) {
  useEffect(() => {
    // Load Mermaid dynamically
    const loadMermaid = async () => {
      try {
        // Use dynamic import with proper error handling
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

        // Find all code blocks with mermaid diagrams and render them
        const mermaidBlocks = document.querySelectorAll('code.language-mermaid, pre > code.language-mermaid');
        
        mermaidBlocks.forEach((block, index) => {
          const parent = block.parentElement?.tagName === 'PRE' ? block.parentElement : block;
          const code = block.textContent || '';
          const id = `mermaid-diagram-${index}`;
          
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.id = id;
          div.textContent = code;
          
          if (parent) {
            parent.replaceWith(div);
            
            try {
              mermaid.init(undefined, `#${id}`);
            } catch (error) {
              console.error('Mermaid rendering error:', error);
              div.innerHTML = `<pre style="color:red">Mermaid error: ${error instanceof Error ? error.message : 'Unknown error'}</pre>`;
            }
          }
        });
      } catch (error) {
        console.error('Failed to load Mermaid:', error);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(loadMermaid, 100);
    return () => clearTimeout(timer);
  }, [htmlContent]);

  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
}
