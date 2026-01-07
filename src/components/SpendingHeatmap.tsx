import { useMemo } from 'react';
import { Transaction, FinanceStats } from '@/types/finance';

interface SpendingHeatmapProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

const SpendingHeatmap = ({ transactions, stats }: SpendingHeatmapProps) => {
  const currency = stats.currency || 'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const heatmapData = useMemo(() => {
    const expenses = transactions.filter(t => !t.isIncome);
    if (expenses.length === 0) return null;

    // Get date range
    const dates = expenses.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Group by date
    const dailySpending = new Map<string, number>();
    expenses.forEach(t => {
      const dateKey = t.date.toISOString().split('T')[0];
      dailySpending.set(dateKey, (dailySpending.get(dateKey) || 0) + t.amount);
    });

    // Calculate max for intensity
    const maxSpend = Math.max(...Array.from(dailySpending.values()));
    
    // Build weeks array (last 12 weeks or available data)
    const weeks: { date: Date; amount: number; intensity: number }[][] = [];
    const endDate = new Date(maxDate);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 83); // ~12 weeks
    
    // Adjust to start on Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    let currentDate = new Date(startDate);
    let currentWeek: { date: Date; amount: number; intensity: number }[] = [];
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const amount = dailySpending.get(dateKey) || 0;
      const intensity = maxSpend > 0 ? amount / maxSpend : 0;
      
      currentWeek.push({
        date: new Date(currentDate),
        amount,
        intensity
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxSpend, minDate, maxDate };
  }, [transactions]);

  if (!heatmapData || heatmapData.weeks.length === 0) {
    return null;
  }

  const getIntensityClass = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/30';
    if (intensity < 0.2) return 'bg-foreground/10';
    if (intensity < 0.4) return 'bg-foreground/25';
    if (intensity < 0.6) return 'bg-foreground/40';
    if (intensity < 0.8) return 'bg-foreground/60';
    return 'bg-foreground/80';
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
      <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
        Daily Spending Heatmap
      </p>
      
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] text-[8px] md:text-[9px] text-muted-foreground pr-1">
          {weekDays.map((day, idx) => (
            <div key={idx} className="h-[10px] md:h-[12px] flex items-center">
              {idx % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>
        
        {/* Heatmap grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {heatmapData.weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-[2px] ${getIntensityClass(day.intensity)} transition-colors cursor-default`}
                  title={`${day.date.toLocaleDateString()}: ${formatCurrency(day.amount)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-[9px] md:text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-[3px]">
          {[0, 0.2, 0.4, 0.6, 0.8].map((intensity, idx) => (
            <div
              key={idx}
              className={`w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-[2px] ${getIntensityClass(intensity)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default SpendingHeatmap;
