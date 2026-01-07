import { useMemo } from 'react';
import { Transaction, FinanceStats } from '@/types/finance';

interface QuickInsightsProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

const QuickInsights = ({ transactions, stats }: QuickInsightsProps) => {
  const currency = stats.currency || 'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Impulse Score: ratio of small/frequent purchases to total spending
  // Higher score = more impulsive spending behavior
  const impulseData = useMemo(() => {
    const expenses = transactions.filter(t => !t.isIncome);
    if (expenses.length < 5) return null;

    const avgAmount = stats.totalSpent / expenses.length;
    
    // Transactions below 50% of average are considered "impulse"
    const impulseThreshold = avgAmount * 0.5;
    const impulseTransactions = expenses.filter(t => t.amount < impulseThreshold);
    const impulseTotal = impulseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Score 0-100: weighted by count and total
    const countRatio = impulseTransactions.length / expenses.length;
    const amountRatio = impulseTotal / stats.totalSpent;
    const score = Math.round((countRatio * 60 + amountRatio * 40) * 100);

    // Categorize
    let level: 'low' | 'moderate' | 'high';
    let label: string;
    if (score < 30) {
      level = 'low';
      label = 'Deliberate';
    } else if (score < 55) {
      level = 'moderate';
      label = 'Balanced';
    } else {
      level = 'high';
      label = 'Impulsive';
    }

    return {
      score,
      level,
      label,
      impulseCount: impulseTransactions.length,
      impulseTotal,
      threshold: impulseThreshold
    };
  }, [transactions, stats]);

  // Spending Velocity: how fast money is leaving
  const velocityData = useMemo(() => {
    const expenses = transactions.filter(t => !t.isIncome);
    if (expenses.length < 3) return null;

    // Get date range
    const dates = expenses.map(t => t.date.getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const daySpan = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

    const dailyRate = stats.totalSpent / daySpan;
    const weeklyRate = dailyRate * 7;
    const transactionsPerDay = expenses.length / daySpan;

    // Trend: compare first half vs second half spending rate
    const midDate = new Date((minDate.getTime() + maxDate.getTime()) / 2);
    const firstHalf = expenses.filter(t => t.date <= midDate);
    const secondHalf = expenses.filter(t => t.date > midDate);
    
    const firstHalfDaily = firstHalf.length > 0 
      ? firstHalf.reduce((sum, t) => sum + t.amount, 0) / (daySpan / 2 || 1)
      : 0;
    const secondHalfDaily = secondHalf.length > 0 
      ? secondHalf.reduce((sum, t) => sum + t.amount, 0) / (daySpan / 2 || 1)
      : 0;

    let trend: 'accelerating' | 'stable' | 'slowing';
    let trendPercent = 0;
    
    if (firstHalfDaily > 0) {
      trendPercent = ((secondHalfDaily - firstHalfDaily) / firstHalfDaily) * 100;
      if (trendPercent > 15) trend = 'accelerating';
      else if (trendPercent < -15) trend = 'slowing';
      else trend = 'stable';
    } else {
      trend = 'stable';
    }

    return {
      dailyRate,
      weeklyRate,
      transactionsPerDay,
      daySpan,
      trend,
      trendPercent: Math.abs(trendPercent)
    };
  }, [transactions, stats]);

  if (!impulseData || !velocityData) {
    return null;
  }

  return (
    <div className="mb-6 md:mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {/* Impulse Score */}
        <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
            Impulse Score
          </p>
          
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl md:text-3xl font-light tabular-nums">
              {impulseData.score}
            </span>
            <span className="text-xs text-muted-foreground mb-1">/100</span>
          </div>

          {/* Score bar */}
          <div className="h-1.5 rounded-full bg-muted mb-2">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${impulseData.score}%`,
                backgroundColor: impulseData.level === 'low' 
                  ? 'hsl(var(--foreground))' 
                  : impulseData.level === 'moderate'
                    ? 'hsl(var(--muted-foreground))'
                    : 'hsl(var(--foreground))'
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{impulseData.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {impulseData.impulseCount} small purchases
            </span>
          </div>
        </div>

        {/* Spending Velocity */}
        <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
            Spending Velocity
          </p>
          
          <div className="flex items-end gap-1 mb-2">
            <span className="text-2xl md:text-3xl font-light tabular-nums">
              {formatCurrency(velocityData.dailyRate)}
            </span>
            <span className="text-xs text-muted-foreground mb-1">/day</span>
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {formatCurrency(velocityData.weeklyRate)}/week over {velocityData.daySpan} days
          </p>

          <div className="flex items-center gap-1.5">
            {velocityData.trend === 'accelerating' && (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-[10px]">
                  Accelerating {velocityData.trendPercent.toFixed(0)}%
                </span>
              </>
            )}
            {velocityData.trend === 'slowing' && (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-[10px]">
                  Slowing {velocityData.trendPercent.toFixed(0)}%
                </span>
              </>
            )}
            {velocityData.trend === 'stable' && (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
                <span className="text-[10px]">Steady pace</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickInsights;
