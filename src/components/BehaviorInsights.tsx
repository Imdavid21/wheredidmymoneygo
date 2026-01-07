import { useMemo } from 'react';
import { Transaction, FinanceStats, TopMerchant } from '@/types/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface BehaviorInsightsProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

const BehaviorInsights = ({ transactions, stats }: BehaviorInsightsProps) => {
  const currency = stats.currency || 'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Top merchants
  const topMerchants = useMemo((): TopMerchant[] => {
    const merchantMap = new Map<string, { total: number; count: number }>();
    
    transactions.filter(t => !t.isIncome).forEach(t => {
      // Normalize merchant name
      const name = t.description.substring(0, 25).trim();
      const current = merchantMap.get(name) || { total: 0, count: 0 };
      current.total += t.amount;
      current.count++;
      merchantMap.set(name, current);
    });

    return Array.from(merchantMap.entries())
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        avgTransaction: data.total / data.count
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions]);

  // Spending size distribution
  const spendingDistribution = useMemo(() => {
    const expenses = transactions.filter(t => !t.isIncome);
    
    // Get currency symbol
    const getCurrencySymbol = () => {
      try {
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0
        }).format(0);
        return formatted.replace(/[0-9]/g, '').trim();
      } catch {
        return '$';
      }
    };
    const symbol = getCurrencySymbol();
    
    const ranges = [
      { name: `Under ${symbol}10`, min: 0, max: 10, count: 0, total: 0 },
      { name: `${symbol}10-${symbol}25`, min: 10, max: 25, count: 0, total: 0 },
      { name: `${symbol}25-${symbol}50`, min: 25, max: 50, count: 0, total: 0 },
      { name: `${symbol}50-${symbol}100`, min: 50, max: 100, count: 0, total: 0 },
      { name: `${symbol}100-${symbol}250`, min: 100, max: 250, count: 0, total: 0 },
      { name: `Over ${symbol}250`, min: 250, max: Infinity, count: 0, total: 0 },
    ];

    expenses.forEach(t => {
      const range = ranges.find(r => t.amount >= r.min && t.amount < r.max);
      if (range) {
        range.count++;
        range.total += t.amount;
      }
    });

    return ranges.filter(r => r.count > 0);
  }, [transactions, currency]);

  // Insights
  const insights = useMemo(() => {
    const expenses = transactions.filter(t => !t.isIncome);
    const incomes = transactions.filter(t => t.isIncome);
    
    const results: string[] = [];

    // Largest single expense
    if (expenses.length > 0) {
      const largest = expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0]);
      results.push(`Your largest expense was ${formatCurrency(largest.amount)} at ${largest.description.substring(0, 20)}`);
    }

    // Average daily spend
    const uniqueDays = new Set(expenses.map(t => t.date.toDateString())).size;
    if (uniqueDays > 0) {
      const avgDaily = stats.totalSpent / uniqueDays;
      results.push(`You spend an average of ${formatCurrency(avgDaily)} per day`);
    }

    // Most frequent merchant
    if (topMerchants.length > 0 && topMerchants[0].count > 1) {
      results.push(`${topMerchants[0].name} is your most visited merchant (${topMerchants[0].count} visits)`);
    }

    // Savings rate
    if (incomes.length > 0 && stats.totalIncome > 0) {
      const savingsRate = ((stats.totalIncome - stats.totalSpent) / stats.totalIncome) * 100;
      if (savingsRate > 0) {
        results.push(`Your savings rate is ${savingsRate.toFixed(0)}%`);
      } else {
        results.push(`You spent ${formatCurrency(Math.abs(stats.totalIncome - stats.totalSpent))} more than you earned`);
      }
    }

    // Small purchases add up
    const smallPurchases = expenses.filter(t => t.amount < 10);
    if (smallPurchases.length > 5) {
      const smallTotal = smallPurchases.reduce((sum, t) => sum + t.amount, 0);
      results.push(`${smallPurchases.length} small purchases (under $10) totaled ${formatCurrency(smallTotal)}`);
    }

    return results;
  }, [transactions, stats, topMerchants, formatCurrency]);

  const COLORS = [
    'hsl(var(--foreground))',
    'hsl(var(--muted-foreground))',
    'hsl(0, 0%, 60%)',
    'hsl(0, 0%, 70%)',
    'hsl(0, 0%, 80%)',
    'hsl(0, 0%, 90%)',
  ];

  if (transactions.length < 3) {
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-2 md:mb-3">
            Key Insights
          </p>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs md:text-sm">
                <span className="text-muted-foreground shrink-0">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Top Merchants */}
        <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-2 md:mb-3">
            Top Merchants
          </p>
          <div className="space-y-2">
            {topMerchants.slice(0, 6).map((merchant, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-muted-foreground w-4">{idx + 1}.</span>
                  <span className="text-xs md:text-sm truncate">{merchant.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs md:text-sm font-medium">{formatCurrency(merchant.total)}</p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">{merchant.count} txns</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Size Distribution */}
        <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-2 md:mb-3">
            Transaction Sizes
          </p>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="90%"
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {spendingDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-foreground text-background px-2 py-1 rounded text-[10px] shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p>{data.count} transactions</p>
                            <p>{formatCurrency(data.total)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              {spendingDistribution.slice(0, 5).map((range, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] md:text-xs">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{range.name}</span>
                  </div>
                  <span className="font-medium">{range.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehaviorInsights;