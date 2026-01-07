import { useState, useCallback, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';

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
    if (files.length > 0 && files[0].type === 'text/csv') {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div
      className={`upload-zone ${isDragging ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="w-12 h-12 text-muted-foreground" />
        )}
        
        <div className="text-center">
          <p className="text-lg font-semibold mb-1">
            {isLoading ? 'Processing your data...' : 'Drop your bank statement here'}
          </p>
          <p className="text-muted-foreground text-sm mb-3">
            or click to browse for a CSV file
          </p>
          <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            100% private, processed locally
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadArea;
