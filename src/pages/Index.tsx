import { useState } from 'react';
import Header from '@/components/Header';
import UploadArea from '@/components/UploadArea';
import StatsGrid from '@/components/StatsGrid';
import SankeyDiagram from '@/components/SankeyDiagram';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import { ParsedData } from '@/types/finance';
import { parseFile } from '@/utils/fileParser';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ParsedData | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    
    try {
      const parsedData = await parseFile(file);
      
      if (parsedData.transactions.length === 0) {
        toast({
          title: "No transactions found",
          description: "Could not parse any transactions from this file.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      setData(parsedData);
      toast({
        title: "Done",
        description: `${parsedData.transactions.length} transactions across ${parsedData.categories.length} categories.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not parse this file. Try a different format.",
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
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <Header hasData={!!data} onReset={handleReset} />

        {!data ? (
          <UploadArea onFileUpload={handleFileUpload} isLoading={isLoading} />
        ) : (
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <StatsGrid stats={data.stats} />
            
            {data.categories.length > 0 && (
              <>
                <SankeyDiagram 
                  categories={data.categories} 
                  stats={data.stats} 
                />
                <CategoryBreakdown categories={data.categories} stats={data.stats} />
              </>
            )}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Your data stays on this device. Nothing is uploaded.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
