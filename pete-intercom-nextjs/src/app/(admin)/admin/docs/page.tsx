'use client';

import { useState, useEffect } from 'react';
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

export default function DocsPage() {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load files on mount and when path changes
  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = path ? `/api/docs?path=${encodeURIComponent(path)}` : '/api/docs';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        if (data.files) {
          setFiles(data.files);
          setSelectedFile(null);
        } else if (data.file) {
          // This shouldn't happen with directory listings, but handle it
          setSelectedFile(data.file);
        }
      } else {
        setError(data.error || 'Failed to load files');
      }
    } catch (err) {
      setError('Error loading files: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/docs?path=${encodeURIComponent(path)}`);
      const data = await response.json();

      if (data.success && data.file) {
        setSelectedFile(data.file);
      } else {
        setError(data.error || 'Failed to load file');
      }
    } catch (err) {
      setError('Error loading file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: DocFile) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    } else {
      loadFile(file.path);
    }
  };

  const handleBackClick = () => {
    if (selectedFile) {
      // Close file view, go back to directory listing
      setSelectedFile(null);
    } else if (currentPath) {
      // Go to parent directory
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      setCurrentPath(parentPath);
    }
  };

  const handleLinkClick = (docPath: string) => {
    console.log('[DocsPage] Link clicked:', { docPath, currentFile: selectedFile?.path });

    // Resolve relative paths based on current file location
    let resolvedPath = docPath;

    // If we have a currently selected file, resolve relative to its directory
    if (selectedFile) {
      // Get the directory of the current file
      const currentDir = selectedFile.path.split('/').slice(0, -1).join('/');

      if (docPath.startsWith('./') || docPath.startsWith('../')) {
        // Explicit relative path
        const pathParts = currentDir ? currentDir.split('/') : [];
        const docParts = docPath.split('/');

        for (const part of docParts) {
          if (part === '..') {
            pathParts.pop();
          } else if (part !== '.') {
            pathParts.push(part);
          }
        }

        resolvedPath = pathParts.join('/');
        console.log('[DocsPage] Resolved relative path:', { from: docPath, to: resolvedPath, currentDir });
      } else if (!docPath.startsWith('/')) {
        // Implicit relative path (no ./ or ../ prefix) - resolve relative to current file's directory
        resolvedPath = currentDir ? `${currentDir}/${docPath}` : docPath;
        console.log('[DocsPage] Resolved implicit relative path:', { from: docPath, to: resolvedPath, currentDir });
      }
    } else {
      console.log('[DocsPage] No current file, using path as-is:', resolvedPath);
    }

    // Load the linked file
    console.log('[DocsPage] Loading file:', resolvedPath);
    loadFile(resolvedPath);
  };

  const getBreadcrumbs = () => {
    if (!currentPath && !selectedFile) return ['DEV_MAN'];

    const parts = ['DEV_MAN'];
    if (currentPath) {
      parts.push(...currentPath.split('/'));
    }
    if (selectedFile) {
      parts.push(selectedFile.name);
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentPath('');
            setSelectedFile(null);
          }}
        >
          <Home className="h-4 w-4" />
        </Button>
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
      {(currentPath || selectedFile) && (
        <Button variant="outline" onClick={handleBackClick}>
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
              {currentPath ? currentPath.split('/').pop() : 'Documentation Files'}
            </CardTitle>
            <CardDescription>
              {files.filter(f => f.type === 'directory').length} folders,
              {' '}{files.filter(f => f.type === 'file').length} files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleFileClick(file)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors text-left"
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
                </button>
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
