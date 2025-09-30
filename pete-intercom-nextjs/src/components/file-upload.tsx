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
  onFileProcessed: (data: ParsedData, fileName: string) => void;
  onAllFilesProcessed?: (allData: Array<{ data: ParsedData; fileName: string }>) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
}

type FileStatus = {
  file: File;
  processing: boolean;
  processed: boolean;
  error: string;
  data?: ParsedData;
};

export default function FileUpload({
  onFileProcessed,
  onAllFilesProcessed,
  onError,
  accept = '.csv,.xlsx,.xls',
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  className = ''
}: FileUploadProps) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File, index: number) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      const errorMsg = validation.error || 'Invalid file';
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], error: errorMsg, processing: false };
        return updated;
      });
      if (onError) onError(errorMsg);
      return;
    }

    try {
      // Parse file
      const parsedData = await parseFile(file);

      setFiles(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], processed: true, processing: false, data: parsedData };
        return updated;
      });

      onFileProcessed(parsedData, file.name);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process file';
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], error: errorMsg, processing: false };
        return updated;
      });
      if (onError) onError(errorMsg);
    }
  };

  const handleFilesSelect = async (selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);

    // Add files to state
    const newFiles: FileStatus[] = fileArray.map(file => ({
      file,
      processing: true,
      processed: false,
      error: ''
    }));

    setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);

    // Process each file
    const startIndex = multiple ? files.length : 0;
    await Promise.all(
      fileArray.map((file, index) => processFile(file, startIndex + index))
    );

    // If onAllFilesProcessed callback exists, call it after all files are done
    if (onAllFilesProcessed && multiple) {
      setTimeout(() => {
        setFiles(current => {
          const allData = current
            .filter(f => f.processed && f.data)
            .map(f => ({ data: f.data!, fileName: f.file.name }));

          if (allData.length > 0) {
            onAllFilesProcessed(allData);
          }
          return current;
        });
      }, 100);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current && files.length === 1) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasError = files.some(f => f.error);
  const allProcessed = files.length > 0 && files.every(f => f.processed || f.error);
  const anyProcessing = files.some(f => f.processing);

  return (
    <div className={className}>
      <Card
        className={`border-2 border-dashed ${hasError ? 'border-red-300' : allProcessed ? 'border-green-300' : 'border-gray-300'}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <CardContent className="p-6">
          {files.length === 0 ? (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your {multiple ? 'files' : 'file'} here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supports: CSV, Excel (.xlsx, .xls) • Max {maxSize / 1024 / 1024}MB{multiple ? ' per file' : ''}
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose {multiple ? 'Files' : 'File'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* File List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {files.map((fileStatus, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <File className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{fileStatus.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(fileStatus.file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={fileStatus.processing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {fileStatus.processing && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Processing...</span>
                      </div>
                    )}

                    {fileStatus.processed && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Processed successfully!</span>
                      </div>
                    )}

                    {fileStatus.error && (
                      <div className="flex items-start gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{fileStatus.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                {multiple && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={anyProcessing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add More Files
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={anyProcessing}
                >
                  Clear All
                </Button>
              </div>

              {/* Summary */}
              {files.length > 1 && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  {files.filter(f => f.processed).length} of {files.length} files processed
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}