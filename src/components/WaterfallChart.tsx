import { useMemo } from 'react';
import { Transaction, FinanceStats, CategoryData } from '@/types/finance';

interface WaterfallChartProps {
  transactions: Transaction[];
  stats: FinanceStats;
  categories: CategoryData[];
}

const WaterfallChart = ({ transactions, stats, categories }: WaterfallChartProps) => {
  const currency = stats.currency || 'USD';

  const formatCurrency = (amount: number, compact = false) => {
    if (compact && Math.abs(amount) >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const waterfallData = useMemo(() => {
    if (transactions.length < 3) return null;

    // Opening balance (if available)
    const openingBalance = stats.balanceInfo?.openingBalance || 0;
    
    // Income
    const totalIncome = stats.totalIncome;
    
    // Top expense categories (max 5)
    const topCategories = categories.slice(0, 5);
    const otherExpenses = categories.slice(5).reduce((sum, cat) => sum + cat.total, 0);
    
    // Calculate positions for waterfall
    let runningTotal = openingBalance;
    
    const bars: {
      label: string;
      value: number;
      startY: number;
      endY: number;
      isPositive: boolean;
      isTotal: boolean;
    }[] = [];
    
    // Opening balance (if exists)
    if (openingBalance > 0) {
      bars.push({
        label: 'Opening',
        value: openingBalance,
        startY: 0,
        endY: openingBalance,
        isPositive: true,
        isTotal: true
      });
    }
    
    // Income
    bars.push({
      label: 'Income',
      value: totalIncome,
      startY: runningTotal,
      endY: runningTotal + totalIncome,
      isPositive: true,
      isTotal: false
    });
    runningTotal += totalIncome;
    
    // Expense categories
    topCategories.forEach(cat => {
      bars.push({
        label: cat.name.length > 12 ? cat.name.substring(0, 10) + '..' : cat.name,
        value: -cat.total,
        startY: runningTotal,
        endY: runningTotal - cat.total,
        isPositive: false,
        isTotal: false
      });
      runningTotal -= cat.total;
    });
    
    // Other expenses
    if (otherExpenses > 0) {
      bars.push({
        label: 'Other',
        value: -otherExpenses,
        startY: runningTotal,
        endY: runningTotal - otherExpenses,
        isPositive: false,
        isTotal: false
      });
      runningTotal -= otherExpenses;
    }
    
    // Net/Closing
    bars.push({
      label: 'Net',
      value: runningTotal,
      startY: 0,
      endY: runningTotal,
      isPositive: runningTotal >= 0,
      isTotal: true
    });
    
    // Calculate max for scaling
    const allValues = bars.flatMap(b => [Math.abs(b.startY), Math.abs(b.endY)]);
    const maxValue = Math.max(...allValues);
    
    return { bars, maxValue, runningTotal };
  }, [transactions, stats, categories]);

  if (!waterfallData) return null;

  const chartHeight = 160;
  const barWidth = 100 / waterfallData.bars.length;
  
  const getY = (value: number) => {
    const normalized = value / waterfallData.maxValue;
    return chartHeight * (1 - normalized * 0.8) - chartHeight * 0.1;
  };

  return (
    <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
      <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
        Income vs Expenses Flow
      </p>
      
      {/* Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        {/* Zero line */}
        <div 
          className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/30"
          style={{ top: getY(0) }}
        />
        
        {/* Bars */}
        <div className="absolute inset-0 flex">
          {waterfallData.bars.map((bar, idx) => {
            const top = Math.min(getY(bar.startY), getY(bar.endY));
            const bottom = Math.max(getY(bar.startY), getY(bar.endY));
            const height = bottom - top;
            
            return (
              <div 
                key={idx} 
                className="relative flex-1 flex flex-col items-center"
              >
                {/* Bar */}
                <div
                  className={`absolute left-1 right-1 md:left-2 md:right-2 rounded-sm transition-all ${
                    bar.isTotal 
                      ? 'bg-foreground' 
                      : bar.isPositive 
                        ? 'bg-foreground/60' 
                        : 'bg-foreground/30'
                  }`}
                  style={{ 
                    top: `${top}px`, 
                    height: `${Math.max(height, 2)}px` 
                  }}
                />
                
                {/* Value label */}
                <div 
                  className="absolute text-[8px] md:text-[9px] font-medium whitespace-nowrap"
                  style={{ 
                    top: `${top - 14}px`,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  {bar.isPositive || bar.isTotal ? '' : ''}{formatCurrency(Math.abs(bar.value), true)}
                </div>
                
                {/* Connector line (except for totals and first bar) */}
                {idx > 0 && !bar.isTotal && !waterfallData.bars[idx - 1].isTotal && (
                  <div 
                    className="absolute right-full w-full border-t border-dashed border-muted-foreground/20"
                    style={{ top: `${getY(bar.startY)}px` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex mt-2">
        {waterfallData.bars.map((bar, idx) => (
          <div key={idx} className="flex-1 text-center">
            <p className={`text-[8px] md:text-[9px] truncate px-0.5 ${
              bar.isTotal ? 'font-medium' : 'text-muted-foreground'
            }`}>
              {bar.label}
            </p>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs md:text-sm">
        <span className="text-muted-foreground">Net Result</span>
        <span className={`font-medium ${waterfallData.runningTotal < 0 ? 'text-foreground' : ''}`}>
          {waterfallData.runningTotal >= 0 ? '+' : ''}{formatCurrency(waterfallData.runningTotal)}
        </span>
      </div>
    </div>
  );
};

export default WaterfallChart;
