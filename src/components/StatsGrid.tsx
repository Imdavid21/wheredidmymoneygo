import { FinanceStats } from '@/types/finance';
import { TrendingUp, TrendingDown, RefreshCw, Calculator } from 'lucide-react';

interface StatsGridProps {
  stats: FinanceStats;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const StatsGrid = ({ stats }: StatsGridProps) => {
  const statCards = [
    {
      label: 'Total Income',
      value: formatCurrency(stats.totalIncome),
      subtext: `${stats.incomeCount} deposit${stats.incomeCount !== 1 ? 's' : ''}`,
      icon: TrendingUp,
      colorClass: 'text-green-600'
    },
    {
      label: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      subtext: `${stats.spentCount} transaction${stats.spentCount !== 1 ? 's' : ''}`,
      icon: TrendingDown,
      colorClass: 'text-red-500'
    },
    {
      label: 'Recurring Charges',
      value: formatCurrency(stats.recurringCharges),
      subtext: `${stats.recurringCount} subscription${stats.recurringCount !== 1 ? 's' : ''}/month`,
      icon: RefreshCw,
      colorClass: 'text-blue-500'
    },
    {
      label: 'Avg Per Transaction',
      value: formatCurrency(stats.avgPerTransaction),
      subtext: 'per purchase',
      icon: Calculator,
      colorClass: 'text-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {statCards.map((stat) => (
        <div key={stat.label} className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </span>
            <stat.icon className={`w-5 h-5 ${stat.colorClass}`} />
          </div>
          <p className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
            {stat.value}
          </p>
          <p className="text-sm text-muted-foreground">
            {stat.subtext}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
