import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import UploadArea from '@/components/UploadArea';
import StatsGrid from '@/components/StatsGrid';
import SankeyDiagram from '@/components/SankeyDiagram';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import SpendingTrends from '@/components/SpendingTrends';
import BehaviorInsights from '@/components/BehaviorInsights';
import { ParsedData, Transaction, CategoryData, IncomeSource, FinanceStats } from '@/types/finance';
import { parseFile } from '@/utils/fileParser';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function generateCategoryColor(index: number, total: number): string {
  // Softer, more muted pastel palette
  const hue = (index * 360 / Math.max(total, 1)) % 360;
  return `hsl(${hue}, 35%, 65%)`;
}

interface ParsedDataWithCurrency extends ParsedData {
  originalCurrency?: string;
}

async function convertCurrencies(
  results: ParsedDataWithCurrency[],
  targetCurrency: string
): Promise<ParsedDataWithCurrency[]> {
  // Collect all amounts that need conversion
  const conversionsNeeded: { amount: number; currency: string; resultIdx: number; txnIdx: number }[] = [];
  
  results.forEach((result, resultIdx) => {
    const sourceCurrency = result.stats.currency || 'USD';
    if (sourceCurrency !== targetCurrency) {
      result.transactions.forEach((txn, txnIdx) => {
        conversionsNeeded.push({
          amount: txn.amount,
          currency: sourceCurrency,
          resultIdx,
          txnIdx
        });
      });
    }
  });
  
  if (conversionsNeeded.length === 0) {
    return results;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('convert-currency', {
      body: {
        amounts: conversionsNeeded.map(c => c.amount),
        fromCurrencies: conversionsNeeded.map(c => c.currency),
        toCurrency: targetCurrency
      }
    });
    
    if (error || !data?.convertedAmounts) {
      console.error('Currency conversion failed:', error);
      return results;
    }
    
    // Apply conversions
    const convertedResults = results.map((result, resultIdx) => {
      const sourceCurrency = result.stats.currency || 'USD';
      if (sourceCurrency === targetCurrency) {
        return { ...result, originalCurrency: sourceCurrency };
      }
      
      const newTransactions = result.transactions.map((txn, txnIdx) => {
        const conversionIdx = conversionsNeeded.findIndex(
          c => c.resultIdx === resultIdx && c.txnIdx === txnIdx
        );
        if (conversionIdx !== -1) {
          return { ...txn, amount: data.convertedAmounts[conversionIdx] };
        }
        return txn;
      });
      
      return {
        ...result,
        transactions: newTransactions,
        originalCurrency: sourceCurrency,
        stats: { ...result.stats, currency: targetCurrency }
      };
    });
    
    return convertedResults;
  } catch (e) {
    console.error('Currency conversion error:', e);
    return results;
  }
}

function mergeData(results: ParsedDataWithCurrency[]): ParsedData {
  // Merge all transactions
  const allTransactions: Transaction[] = [];
  const allSourceFiles: string[] = [];
  
  results.forEach((result, idx) => {
    allTransactions.push(...result.transactions);
    if (result.sourceFiles) {
      allSourceFiles.push(...result.sourceFiles);
    } else {
      allSourceFiles.push(`File ${idx + 1}`);
    }
  });

  // Use the target currency (should be uniform after conversion)
  const primaryCurrency = results[0]?.stats.currency || 'USD';

  // Recalculate categories
  const incomeTransactions = allTransactions.filter(t => t.isIncome);
  const expenseTransactions = allTransactions.filter(t => !t.isIncome);
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Detect recurring charges
  const merchantCounts: Record<string, { count: number; total: number }> = {};
  for (const t of expenseTransactions) {
    const key = t.description.substring(0, 15).toLowerCase();
    if (!merchantCounts[key]) {
      merchantCounts[key] = { count: 0, total: 0 };
    }
    merchantCounts[key].count++;
    merchantCounts[key].total += t.amount;
  }
  
  let recurringCharges = 0;
  let recurringCount = 0;
  for (const [, data] of Object.entries(merchantCounts)) {
    if (data.count >= 2) {
      recurringCharges += data.total / data.count;
      recurringCount++;
    }
  }

  // Group expenses by category
  const categoryMap = new Map<string, Transaction[]>();
  for (const t of expenseTransactions) {
    const existing = categoryMap.get(t.category) || [];
    existing.push(t);
    categoryMap.set(t.category, existing);
  }
  
  const categories: CategoryData[] = [];
  let colorIndex = 0;
  const totalCategories = categoryMap.size;
  
  const sortedCategories = Array.from(categoryMap.entries())
    .sort((a, b) => {
      const totalA = a[1].reduce((sum, t) => sum + t.amount, 0);
      const totalB = b[1].reduce((sum, t) => sum + t.amount, 0);
      return totalB - totalA;
    });
  
  for (const [name, txns] of sortedCategories) {
    const total = txns.reduce((sum, t) => sum + t.amount, 0);
    const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
    
    categories.push({
      name,
      total,
      percentage,
      transactions: txns.sort((a, b) => b.amount - a.amount),
      color: generateCategoryColor(colorIndex, totalCategories)
    });
    
    colorIndex++;
  }

  // Group income by source
  const incomeMap = new Map<string, Transaction[]>();
  for (const t of incomeTransactions) {
    const sourceName = t.description.length > 20 
      ? t.description.substring(0, 20) + '...' 
      : t.description;
    const existing = incomeMap.get(sourceName) || [];
    existing.push(t);
    incomeMap.set(sourceName, existing);
  }
  
  const incomeSources: IncomeSource[] = Array.from(incomeMap.entries())
    .map(([name, txns]) => ({
      name,
      total: txns.reduce((sum, t) => sum + t.amount, 0),
      count: txns.length,
      transactions: txns
    }))
    .sort((a, b) => b.total - a.total);

  // Merge balance info (take first available of each type)
  const creditCardBalance = results.find(r => r.stats.balanceInfo?.type === 'credit_card')?.stats.balanceInfo;
  const bankBalance = results.find(r => r.stats.balanceInfo?.type === 'bank')?.stats.balanceInfo;

  const stats: FinanceStats = {
    totalIncome,
    incomeCount: incomeTransactions.length,
    totalSpent,
    spentCount: expenseTransactions.length,
    recurringCharges,
    recurringCount,
    avgPerTransaction: expenseTransactions.length > 0 
      ? totalSpent / expenseTransactions.length 
      : 0,
    currency: primaryCurrency,
    balanceInfo: creditCardBalance || bankBalance
  };

  return {
    transactions: allTransactions,
    categories,
    incomeSources,
    stats,
    sourceFiles: allSourceFiles
  };
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ParsedData | null>(null);

  const handleFilesUpload = async (files: File[]) => {
    setIsLoading(true);
    
    try {
      // Parse all files in parallel
      const results = await Promise.all(
        files.map(async (file): Promise<ParsedDataWithCurrency | null> => {
          try {
            const result = await parseFile(file);
            return { ...result, sourceFiles: [file.name], originalCurrency: result.stats.currency };
          } catch (e) {
            console.error(`Failed to parse ${file.name}:`, e);
            return null;
          }
        })
      );
      
      // Filter out failed parses
      let successfulResults = results.filter(
        (r): r is ParsedDataWithCurrency => r !== null && r.transactions.length > 0
      );
      
      if (successfulResults.length === 0) {
        toast({
          title: "No transactions found",
          description: "Could not parse any transactions from the uploaded files.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Check for multiple currencies
      const currencies = new Set(successfulResults.map(r => r.stats.currency || 'USD'));
      
      if (currencies.size > 1) {
        // Find the most used currency (by transaction count)
        const currencyCounts = new Map<string, number>();
        successfulResults.forEach(r => {
          const curr = r.stats.currency || 'USD';
          currencyCounts.set(curr, (currencyCounts.get(curr) || 0) + r.transactions.length);
        });
        const targetCurrency = Array.from(currencyCounts.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD';
        
        toast({
          title: "Converting currencies",
          description: `Multiple currencies detected. Converting to ${targetCurrency} using live rates.`
        });
        
        // Convert all transactions to target currency
        successfulResults = await convertCurrencies(successfulResults, targetCurrency);
      }

      // Merge all results
      const mergedData = successfulResults.length === 1 
        ? successfulResults[0] 
        : mergeData(successfulResults);

      setData(mergedData);
      
      const failedCount = files.length - successfulResults.length;
      const currencyNote = currencies.size > 1 ? ` (converted to ${mergedData.stats.currency})` : '';
      toast({
        title: "Analysis complete",
        description: `${mergedData.transactions.length} transactions across ${mergedData.categories.length} categories${currencyNote}${failedCount > 0 ? ` (${failedCount} file${failedCount > 1 ? 's' : ''} failed)` : ''}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not parse the files. Try a different format.",
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 md:py-12">
        <Header hasData={!!data} onReset={handleReset} />

        {!data ? (
          <UploadArea onFilesUpload={handleFilesUpload} isLoading={isLoading} />
        ) : (
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Source files indicator */}
            {data.sourceFiles && data.sourceFiles.length > 1 && (
              <div className="mb-4 p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Combined data from {data.sourceFiles.length} files
                </p>
              </div>
            )}
            
            <StatsGrid stats={data.stats} incomeSources={data.incomeSources} />
            
            {data.categories.length > 0 && (
              <SankeyDiagram 
                categories={data.categories} 
                stats={data.stats} 
              />
            )}
            
            <BehaviorInsights transactions={data.transactions} stats={data.stats} />
            
            <SpendingTrends transactions={data.transactions} stats={data.stats} />
            
            {data.categories.length > 0 && (
              <CategoryBreakdown categories={data.categories} stats={data.stats} />
            )}
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-6 mb-4">
            <Link 
              to="/privacy" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy & Security
            </Link>
            <Link 
              to="/faq" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your data is never stored. Files are analyzed and immediately discarded.</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;