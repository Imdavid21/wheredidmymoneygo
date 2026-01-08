import { useMemo, useState } from 'react';
import { Transaction, FinanceStats, TopMerchant } from '@/types/finance';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface KeyInsightsProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

interface Insight {
  id: string;
  text: string;
  detail?: string;
}

const KeyInsights = ({ transactions, stats }: KeyInsightsProps) => {
  const currency = stats.currency || 'USD';
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
      .slice(0, 5);
  }, [transactions]);

  const insights = useMemo((): Insight[] => {
    const expenses = transactions.filter(t => !t.isIncome);
    const results: Insight[] = [];
    const seenTypes = new Set<string>();

    // Largest expense
    if (expenses.length > 0) {
      const largest = expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0]);
      if (!seenTypes.has('largest')) {
        results.push({
          id: 'largest',
          text: `Biggest expense: ${formatCurrency(largest.amount)}`,
          detail: `at ${largest.description.substring(0, 30)}`
        });
        seenTypes.add('largest');
      }
    }

    // Daily average
    const uniqueDays = new Set(expenses.map(t => t.date.toDateString())).size;
    if (uniqueDays > 0 && !seenTypes.has('daily')) {
      const avgDaily = stats.totalSpent / uniqueDays;
      results.push({
        id: 'daily',
        text: `Daily average: ${formatCurrency(avgDaily)}`,
        detail: `across ${uniqueDays} days`
      });
      seenTypes.add('daily');
    }

    // Top merchant
    if (topMerchants.length > 0 && !seenTypes.has('top-merchant')) {
      const top = topMerchants[0];
      results.push({
        id: 'top-merchant',
        text: `Top merchant: ${top.name}`,
        detail: `${formatCurrency(top.total)} (${top.count} visits)`
      });
      seenTypes.add('top-merchant');
    }

    // Small purchases
    const small = expenses.filter(t => t.amount < 10);
    if (small.length > 5 && !seenTypes.has('small')) {
      const smallTotal = small.reduce((sum, t) => sum + t.amount, 0);
      results.push({
        id: 'small',
        text: `Small purchases add up`,
        detail: `${small.length} transactions under $10 = ${formatCurrency(smallTotal)}`
      });
      seenTypes.add('small');
    }

    // Large purchases
    const large = expenses.filter(t => t.amount >= 100);
    if (large.length > 0 && !seenTypes.has('large')) {
      const largeTotal = large.reduce((sum, t) => sum + t.amount, 0);
      const pct = ((largeTotal / stats.totalSpent) * 100).toFixed(0);
      results.push({
        id: 'large',
        text: `${large.length} big purchases`,
        detail: `$100+ transactions = ${pct}% of spending`
      });
      seenTypes.add('large');
    }

    // Weekend vs weekday
    const weekendExpenses = expenses.filter(t => {
      const day = t.date.getDay();
      return day === 0 || day === 6;
    });
    const weekdayExpenses = expenses.filter(t => {
      const day = t.date.getDay();
      return day >= 1 && day <= 5;
    });
    
    if (weekendExpenses.length > 0 && weekdayExpenses.length > 0 && !seenTypes.has('weekend')) {
      const weekendAvg = weekendExpenses.reduce((sum, t) => sum + t.amount, 0) / weekendExpenses.length;
      const weekdayAvg = weekdayExpenses.reduce((sum, t) => sum + t.amount, 0) / weekdayExpenses.length;
      
      if (weekendAvg > weekdayAvg * 1.2) {
        results.push({
          id: 'weekend',
          text: 'Weekend spending is higher',
          detail: `${formatCurrency(weekendAvg)} avg vs ${formatCurrency(weekdayAvg)} weekday`
        });
        seenTypes.add('weekend');
      }
    }

    // Most active day
    const dayTotals = new Map<number, number>();
    expenses.forEach(t => {
      const day = t.date.getDay();
      dayTotals.set(day, (dayTotals.get(day) || 0) + t.amount);
    });
    
    if (dayTotals.size > 0 && !seenTypes.has('active-day')) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const [topDay] = Array.from(dayTotals.entries()).sort((a, b) => b[1] - a[1])[0];
      results.push({
        id: 'active-day',
        text: `${days[topDay]}s are expensive`,
        detail: `Most spending happens on ${days[topDay]}s`
      });
      seenTypes.add('active-day');
    }

    return results;
  }, [transactions, stats, topMerchants, formatCurrency]);

  if (transactions.length < 3 || insights.length === 0) {
    return null;
  }

  const displayInsights = expanded ? insights : insights.slice(0, 3);

  return (
    <div className="mb-6 md:mb-8">
      <div className="p-4 md:p-5 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h2 className="text-sm md:text-base font-semibold">Insights</h2>
        </div>
        
        <div className="space-y-2">
          {displayInsights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <div>
                <span className="text-sm">{insight.text}</span>
                {insight.detail && (
                  <span className="text-xs text-muted-foreground ml-1">— {insight.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {insights.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 pt-3 border-t border-border flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Show {insights.length - 3} more insights <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default KeyInsights;
