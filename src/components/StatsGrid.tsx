import { FinanceStats } from '@/types/finance';

interface StatsGridProps {
  stats: FinanceStats;
}

const StatsGrid = ({ stats }: StatsGridProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    {
      label: 'Income',
      value: formatCurrency(stats.totalIncome),
      subtext: `${stats.incomeCount} deposits`
    },
    {
      label: 'Spent',
      value: formatCurrency(stats.totalSpent),
      subtext: `${stats.spentCount} transactions`
    },
    {
      label: 'Recurring',
      value: formatCurrency(stats.recurringCharges),
      subtext: `${stats.recurringCount} subscriptions`
    },
    {
      label: 'Average',
      value: formatCurrency(stats.avgPerTransaction),
      subtext: 'per transaction'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
      {statCards.map((stat) => (
        <div 
          key={stat.label} 
          className="p-4 md:p-5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
        >
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
            {stat.label}
          </p>
          <p className="text-xl md:text-2xl font-semibold tracking-tight">
            {stat.value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stat.subtext}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
