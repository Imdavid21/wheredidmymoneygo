import { useState } from 'react';
import Header from '@/components/Header';
import UploadArea from '@/components/UploadArea';
import StatsGrid from '@/components/StatsGrid';
import SankeyDiagram from '@/components/SankeyDiagram';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import { ParsedData } from '@/types/finance';
import { parseCSV } from '@/utils/csvParser';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ParsedData | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    
    try {
      const parsedData = await parseCSV(file);
      
      if (parsedData.transactions.length === 0) {
        toast({
          title: "No transactions found",
          description: "The CSV file doesn't contain any recognizable transactions.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      setData(parsedData);
      toast({
        title: "Success!",
        description: `Processed ${parsedData.transactions.length} transactions across ${parsedData.categories.length} categories.`
      });
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: "Please make sure you're uploading a valid CSV bank statement.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <Header />

        {!data ? (
          <UploadArea onFileUpload={handleFileUpload} isLoading={isLoading} />
        ) : (
          <div className="animate-fade-in">
            <div className="flex justify-end mb-6">
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Upload different file
              </button>
            </div>

            <StatsGrid stats={data.stats} />
            
            {data.categories.length > 0 && (
              <>
                <SankeyDiagram 
                  categories={data.categories} 
                  stats={data.stats} 
                />
                <CategoryBreakdown categories={data.categories} />
              </>
            )}
          </div>
        )}

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Your data never leaves your device. 100% private.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
