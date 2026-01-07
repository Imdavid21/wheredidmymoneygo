import { useMemo } from 'react';
import { Transaction, FinanceStats, TopMerchant } from '@/types/finance';

interface KeyInsightsProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

const KeyInsights = ({ transactions, stats }: KeyInsightsProps) => {
  const currency = stats.currency || 'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Top merchants for insight generation
  const topMerchants = useMemo((): TopMerchant[] => {
    const merchantMap = new Map<string, { total: number; count: number }>();
    
    transactions.filter(t => !t.isIncome).forEach(t => {
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

    // Savings rate - only for bank statements (not credit cards)
    const isCreditCard = stats.balanceInfo?.type === 'credit_card';
    if (!isCreditCard && incomes.length > 0 && stats.totalIncome > 0) {
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

  if (transactions.length < 3 || insights.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 md:mb-8">
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
    </div>
  );
};

export default KeyInsights;
