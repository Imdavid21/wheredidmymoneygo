import { FinanceStats, IncomeSource } from '@/types/finance';
import { Progress } from '@/components/ui/progress';

interface StatsGridProps {
  stats: FinanceStats;
  incomeSources: IncomeSource[];
}

const StatsGrid = ({ stats, incomeSources }: StatsGridProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const balanceInfo = stats.balanceInfo;
  const isCreditCard = balanceInfo?.type === 'credit_card';
  const isBank = balanceInfo?.type === 'bank';

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

  const creditUsagePercent = isCreditCard && balanceInfo.creditLimit 
    ? ((balanceInfo.creditUsed || 0) / balanceInfo.creditLimit) * 100 
    : 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Balance Information */}
      {balanceInfo && (
        <div className="p-4 md:p-5 rounded-lg border border-border bg-card">
          {isCreditCard && balanceInfo.creditLimit && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Credit Card
                </p>
                <p className="text-xs text-muted-foreground">
                  {creditUsagePercent.toFixed(0)}% used
                </p>
              </div>
              <Progress value={creditUsagePercent} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>
                  <span className="text-muted-foreground">Used: </span>
                  <span className="font-medium">{formatCurrency(balanceInfo.creditUsed || 0)}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">Limit: </span>
                  <span className="font-medium">{formatCurrency(balanceInfo.creditLimit)}</span>
                </span>
              </div>
              {balanceInfo.availableCredit !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Available: {formatCurrency(balanceInfo.availableCredit)}
                </p>
              )}
            </div>
          )}
          {(isBank || balanceInfo.type === 'other') && (balanceInfo.openingBalance !== undefined || balanceInfo.closingBalance !== undefined) && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
                {isBank ? 'Bank Account' : 'Account'} Balance
              </p>
              <div className="flex justify-between text-sm">
                {balanceInfo.openingBalance !== undefined && (
                  <span>
                    <span className="text-muted-foreground">Opening: </span>
                    <span className="font-medium">{formatCurrency(balanceInfo.openingBalance)}</span>
                  </span>
                )}
                {balanceInfo.closingBalance !== undefined && (
                  <span>
                    <span className="text-muted-foreground">Closing: </span>
                    <span className="font-medium">{formatCurrency(balanceInfo.closingBalance)}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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

      {/* Income Sources */}
      {incomeSources.length > 0 && (
        <div className="p-4 md:p-5 rounded-lg border border-border bg-card">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
            Income Sources
          </p>
          <div className="space-y-2">
            {incomeSources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[60%]">{source.name}</span>
                <span className="font-medium">{formatCurrency(source.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsGrid;
