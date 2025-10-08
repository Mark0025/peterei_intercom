'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/docs/MarkdownRenderer';
import { FileText, Folder, Home, ChevronRight } from 'lucide-react';

interface DocFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

interface DocContent {
  name: string;
  path: string;
  content: string;
  size: number;
  modified: string;
}

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default function DocsPage({ params }: PageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [files, setFiles] = useState<DocFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string[]>([]);

  // Unwrap params promise (Next.js 15+)
  // Use pathname as dependency to ensure it updates when route changes
  useEffect(() => {
    params.then(resolvedParams => {
      console.log('[DocsPage] Params resolved:', resolvedParams);
      setCurrentSlug(resolvedParams.slug || []);
    });
  }, [params, pathname]);

  // Compute current path from slug
  const currentPath = currentSlug.join('/');

  // Load files when slug changes
  useEffect(() => {
    loadContent(currentPath);
  }, [currentPath]);

  const loadContent = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = path ? `/api/docs?path=${encodeURIComponent(path)}` : '/api/docs';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (data.files) {
          // Directory listing
          setFiles(data.files);
          setSelectedFile(null);
        } else if (data.file) {
          // Single file
          setSelectedFile(data.file);
          setFiles([]);
        }
      } else {
        setError(data.error || 'Failed to load content');
      }
    } catch (err) {
      setError('Error loading content: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (docPath: string) => {
    console.log('[DocsPage] Link clicked:', { docPath, currentPath });

    // Resolve relative paths based on current location
    let resolvedPath = docPath;

    if (docPath.startsWith('./') || docPath.startsWith('../')) {
      // Explicit relative path
      const pathParts = currentPath ? currentPath.split('/') : [];
      const docParts = docPath.split('/');

      for (const part of docParts) {
        if (part === '..') {
          pathParts.pop();
        } else if (part !== '.') {
          pathParts.push(part);
        }
      }

      resolvedPath = pathParts.join('/');
    } else if (!docPath.startsWith('/') && currentPath) {
      // Implicit relative path - resolve relative to current directory
      const currentDir = selectedFile
        ? currentPath.split('/').slice(0, -1).join('/')
        : currentPath;
      resolvedPath = currentDir ? `${currentDir}/${docPath}` : docPath;
    }

    console.log('[DocsPage] Navigating to:', resolvedPath);

    // Use Next.js router for navigation
    router.push(`/admin/docs/${resolvedPath}`);
  };

  const getBreadcrumbs = () => {
    const parts = ['DEV_MAN'];
    if (currentSlug.length > 0) {
      parts.push(...currentSlug);
    }
    return parts;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📚 DEV_MAN Documentation Browser
          </CardTitle>
          <CardDescription>
            Browse development documentation with full Mermaid diagram support
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/docs">
          <Button variant="ghost" size="sm">
            <Home className="h-4 w-4" />
          </Button>
        </Link>
        {getBreadcrumbs().map((part, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <span className={index === getBreadcrumbs().length - 1 ? 'font-semibold' : ''}>
              {part}
            </span>
          </div>
        ))}
      </div>

      {/* Back Button */}
      {currentSlug.length > 0 && (
        <Button
          variant="outline"
          onClick={() => {
            const parentPath = currentSlug.slice(0, -1).join('/');
            router.push(parentPath ? `/admin/docs/${parentPath}` : '/admin/docs');
          }}
        >
          ← Back
        </Button>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      )}

      {/* File Content View */}
      {selectedFile && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedFile.name}
            </CardTitle>
            <CardDescription>
              {formatSize(selectedFile.size)} • Last modified: {formatDate(selectedFile.modified)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer
              content={selectedFile.content}
              className="max-w-none"
              onLinkClick={handleLinkClick}
            />
          </CardContent>
        </Card>
      )}

      {/* File/Directory Listing */}
      {!selectedFile && !loading && files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentSlug.length > 0 ? currentSlug[currentSlug.length - 1] : 'Documentation Files'}
            </CardTitle>
            <CardDescription>
              {files.filter(f => f.type === 'directory').length} folders,
              {' '}{files.filter(f => f.type === 'file').length} files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <Link
                  key={file.path}
                  href={`/admin/docs/${file.path}`}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {file.type === 'directory' ? (
                      <Folder className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <div className="font-medium">{file.name}</div>
                      {file.type === 'file' && (
                        <div className="text-sm text-muted-foreground">
                          {formatSize(file.size)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(file.modified)}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedFile && !loading && files.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No files found in this directory</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
