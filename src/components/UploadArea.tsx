import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface UploadAreaProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const UploadArea = ({ onFileUpload, isLoading }: UploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div
      className={cn(
        "relative border border-dashed rounded-lg p-8 sm:p-12 md:p-24 transition-all duration-200 cursor-pointer",
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
            {isLoading ? 'Analyzing with AI...' : 'Drop your bank statement'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            CSV, XLSX, or PDF
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
  );
};

export default UploadArea;
