/**
 * API Route: DEV_MAN Documentation Browser
 *
 * Serves markdown files from DEV_MAN directory with:
 * - File listing (GET without path param)
 * - File content reading (GET with path param)
 * - Security: Only serves .md files from DEV_MAN directory
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DEV_MAN_PATH = path.join(process.cwd(), 'DEV_MAN');

interface DocFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    // If no path, return directory listing
    if (!filePath) {
      const files = await listFiles(DEV_MAN_PATH, '');
      return NextResponse.json({ success: true, files });
    }

    // Security check: prevent path traversal
    const sanitizedPath = filePath.replace(/\.\./g, '');
    const fullPath = path.join(DEV_MAN_PATH, sanitizedPath);

    // Ensure path is within DEV_MAN directory
    if (!fullPath.startsWith(DEV_MAN_PATH)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        // Return directory listing
        const files = await listFiles(fullPath, sanitizedPath);
        return NextResponse.json({ success: true, files });
      }

      // Only serve markdown files
      if (!fullPath.endsWith('.md')) {
        return NextResponse.json(
          { success: false, error: 'Only markdown files are allowed' },
          { status: 403 }
        );
      }

      // Read file content
      const content = await fs.readFile(fullPath, 'utf-8');

      return NextResponse.json({
        success: true,
        file: {
          name: path.basename(fullPath),
          path: sanitizedPath,
          content,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        }
      });

    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('[DocsAPI] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Recursively list files in a directory
 */
async function listFiles(dir: string, relativePath: string): Promise<DocFile[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: DocFile[] = [];

  for (const entry of entries) {
    // Skip hidden files and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    const entryPath = path.join(dir, entry.name);
    const stats = await fs.stat(entryPath);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      files.push({
        name: entry.name,
        path: relPath,
        type: 'directory',
        modified: stats.mtime.toISOString(),
      });
    } else if (entry.name.endsWith('.md')) {
      files.push({
        name: entry.name,
        path: relPath,
        type: 'file',
        size: stats.size,
        modified: stats.mtime.toISOString(),
      });
    }
  }

  // Sort: directories first, then by name
  return files.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
