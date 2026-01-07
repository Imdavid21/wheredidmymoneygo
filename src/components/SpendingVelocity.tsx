import { useMemo } from 'react';
import { Transaction, FinanceStats } from '@/types/finance';

interface SpendingVelocityProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

const SpendingVelocity = ({ transactions, stats }: SpendingVelocityProps) => {
  const currency = stats.currency || 'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const velocityData = useMemo(() => {
    const expenses = transactions.filter(t => !t.isIncome);
    const incomes = transactions.filter(t => t.isIncome);
    
    if (expenses.length < 3) return null;

    // Get date range
    const dates = transactions.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const daySpan = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate daily rates
    const dailySpendRate = stats.totalSpent / daySpan;
    const dailyIncomeRate = stats.totalIncome / daySpan;
    
    // Velocity ratio (spending relative to income)
    const velocityRatio = dailyIncomeRate > 0 ? dailySpendRate / dailyIncomeRate : 1;
    
    // Calculate burn rate and runway
    const netDaily = dailyIncomeRate - dailySpendRate;
    const monthlyBurn = dailySpendRate * 30;
    const monthlyIncome = dailyIncomeRate * 30;
    
    // Savings potential
    const savingsRate = stats.totalIncome > 0 
      ? ((stats.totalIncome - stats.totalSpent) / stats.totalIncome) * 100 
      : 0;

    // Status interpretation
    let status: 'surplus' | 'balanced' | 'deficit' = 'balanced';
    let statusText = '';
    
    if (savingsRate > 20) {
      status = 'surplus';
      statusText = 'Saving well';
    } else if (savingsRate > 0) {
      status = 'balanced';
      statusText = 'Breaking even';
    } else {
      status = 'deficit';
      statusText = 'Spending exceeds income';
    }

    return {
      dailySpendRate,
      dailyIncomeRate,
      velocityRatio,
      netDaily,
      monthlyBurn,
      monthlyIncome,
      savingsRate,
      daySpan,
      status,
      statusText
    };
  }, [transactions, stats]);

  if (!velocityData) return null;

  // Visual bar for velocity
  const velocityPercent = Math.min(velocityData.velocityRatio * 100, 150);
  const isOverspending = velocityData.velocityRatio > 1;

  return (
    <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
      <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
        Spending Velocity
      </p>
      
      {/* Velocity bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mb-1.5">
          <span>Spending vs Income</span>
          <span className={isOverspending ? 'text-foreground font-medium' : ''}>
            {(velocityData.velocityRatio * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 md:h-2.5 rounded-full bg-muted overflow-hidden relative">
          {/* 100% marker */}
          <div className="absolute left-[66.67%] top-0 bottom-0 w-px bg-foreground/30" />
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isOverspending ? 'bg-foreground' : 'bg-foreground/60'
            }`}
            style={{ width: `${Math.min(velocityPercent / 1.5, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>0%</span>
          <span>100%</span>
          <span>150%</span>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] md:text-[10px] text-muted-foreground">Daily Burn</p>
          <p className="text-sm md:text-base font-medium">{formatCurrency(velocityData.dailySpendRate)}</p>
        </div>
        <div>
          <p className="text-[9px] md:text-[10px] text-muted-foreground">Daily Income</p>
          <p className="text-sm md:text-base font-medium">{formatCurrency(velocityData.dailyIncomeRate)}</p>
        </div>
        <div>
          <p className="text-[9px] md:text-[10px] text-muted-foreground">Monthly Projection</p>
          <p className="text-sm md:text-base font-medium">{formatCurrency(velocityData.monthlyBurn)}</p>
        </div>
        <div>
          <p className="text-[9px] md:text-[10px] text-muted-foreground">Savings Rate</p>
          <p className={`text-sm md:text-base font-medium ${velocityData.savingsRate < 0 ? 'text-foreground' : ''}`}>
            {velocityData.savingsRate.toFixed(0)}%
          </p>
        </div>
      </div>
      
      {/* Status */}
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs md:text-sm">
          <span className="text-muted-foreground">Status: </span>
          <span className="font-medium">{velocityData.statusText}</span>
        </p>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
          Based on {velocityData.daySpan} days of data
        </p>
      </div>
    </div>
  );
};

export default SpendingVelocity;
