import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface UploadAreaProps {
  onFilesUpload: (files: File[]) => void;
  isLoading: boolean;
}

const UploadArea = ({ onFilesUpload, isLoading }: UploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles);
    setSelectedFiles(prev => {
      const combined = [...prev, ...filesArray];
      // Limit to 10 files
      return combined.slice(0, 10);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      addFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = () => {
    if (selectedFiles.length > 0) {
      onFilesUpload(selectedFiles);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative border border-dashed rounded-lg p-6 sm:p-10 md:p-16 transition-all duration-200 cursor-pointer",
          "hover:border-foreground/30 hover:bg-muted/30",
          isDragging && "border-foreground bg-muted/50",
          isLoading && "pointer-events-none opacity-60"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />
        
        <div className="flex flex-col items-center gap-3 text-center">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          ) : (
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
              <svg 
                className="w-4 h-4 text-muted-foreground" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium">
              {isLoading ? 'Analyzing with AI...' : 'Drop your bank statements'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              CSV, XLSX, or PDF • Up to 10 files
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mt-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Data deleted after processing</span>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && !isLoading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </p>
            <button
              onClick={handleClick}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add more files ({10 - selectedFiles.length} left)
            </button>
          </div>
          
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div 
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-medium text-muted-foreground uppercase">
                      {file.name.split('.').pop()}
                    </span>
                  </div>
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleProcess}
            className="w-full py-2.5 px-4 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Analyze {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadArea;