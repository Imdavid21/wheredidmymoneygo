import { useMemo } from 'react';
import { Transaction, FinanceStats, DailySpending, WeekdayPattern } from '@/types/finance';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SpendingTrendsProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

const SpendingTrends = ({ transactions, stats }: SpendingTrendsProps) => {
  const currency = stats.currency || 'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const dailySpending = useMemo((): DailySpending[] => {
    const expenses = transactions.filter(t => !t.isIncome);
    const dailyMap = new Map<string, number>();
    
    expenses.forEach(t => {
      const dateStr = t.date.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + t.amount);
    });

    return Array.from(dailyMap.entries())
      .map(([date, amount]) => {
        const d = new Date(date);
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount,
          dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' })
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  const weekdayPattern = useMemo((): WeekdayPattern[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData: Record<string, { total: number; count: number }> = {};
    
    days.forEach(day => {
      dayData[day] = { total: 0, count: 0 };
    });

    transactions.filter(t => !t.isIncome).forEach(t => {
      const day = t.date.toLocaleDateString('en-US', { weekday: 'short' });
      if (dayData[day]) {
        dayData[day].total += t.amount;
        dayData[day].count++;
      }
    });

    return days.map(day => ({
      day,
      total: dayData[day].total,
      count: dayData[day].count,
      average: dayData[day].count > 0 ? dayData[day].total / dayData[day].count : 0
    }));
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background px-2.5 py-1.5 rounded text-xs shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-background/80">
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (transactions.length < 3) {
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xs md:text-sm font-medium">Spending Trends</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Daily Spending Over Time */}
        {dailySpending.length > 1 && (
          <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
            <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
              Daily Spending
            </p>
            <div className="h-40 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySpending}>
                  <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 9 }} 
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 9 }} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    name="Spent"
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={1.5}
                    fill="url(#spendingGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekday Pattern */}
        <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
            Spending by Day of Week
          </p>
          <div className="h-40 md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayPattern}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v)}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total" 
                  name="Total"
                  fill="hsl(var(--foreground))" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SpendingTrends;