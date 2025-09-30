'use client';

/**
 * Reusable File Upload Component
 *
 * Handles CSV and Excel file uploads with validation and parsing
 * Can be used throughout the application
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { parseFile, validateFile, type ParsedData } from '@/utils/file-parser';

interface FileUploadProps {
  onFileProcessed: (data: ParsedData) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export default function FileUpload({
  onFileProcessed,
  onError,
  accept = '.csv,.xlsx,.xls',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = ''
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setError('');
    setProcessed(false);

    // Validate file
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      const errorMsg = validation.error || 'Invalid file';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setFile(selectedFile);
    setProcessing(true);

    try {
      // Parse file
      const parsedData = await parseFile(selectedFile);
      setProcessed(true);
      onFileProcessed(parsedData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleClear = () => {
    setFile(null);
    setProcessed(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <Card
        className={`border-2 border-dashed ${error ? 'border-red-300' : processed ? 'border-green-300' : 'border-gray-300'}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <CardContent className="p-6">
          {!file ? (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supports: CSV, Excel (.xlsx, .xls) • Max {maxSize / 1024 / 1024}MB
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <File className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={processing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {processing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Processing file...</span>
                </div>
              )}

              {processed && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">File processed successfully!</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}