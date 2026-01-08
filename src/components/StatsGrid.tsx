import { FinanceStats } from '@/types/finance';
import { Progress } from '@/components/ui/progress';

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

  const balanceInfo = stats.balanceInfo;
  const isCreditCard = balanceInfo?.type === 'credit_card';
  const isBank = balanceInfo?.type === 'bank';

  // Simplified stats without income
  const statCards = [
    {
      label: 'Total Spent',
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
    <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
      {/* Balance Information */}
      {balanceInfo && (
        <div className="p-3 md:p-5 rounded-lg border border-border bg-card">
          {isCreditCard && balanceInfo.creditLimit && (
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground">
                  Credit Card
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {creditUsagePercent.toFixed(0)}% used
                </p>
              </div>
              <Progress value={creditUsagePercent} className="h-1.5 md:h-2" />
              <div className="flex justify-between text-xs md:text-sm">
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
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Available: {formatCurrency(balanceInfo.availableCredit)}
                </p>
              )}
            </div>
          )}
          {(isBank || balanceInfo.type === 'other') && (balanceInfo.openingBalance !== undefined || balanceInfo.closingBalance !== undefined) && (
            <div className="space-y-2">
              <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-2 md:mb-3">
                {isBank ? 'Bank Account' : 'Account'} Balance
              </p>
              <div className="flex justify-between text-xs md:text-sm">
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

      {/* Stats Grid - centered 3 cards */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4">
        {statCards.map((stat) => (
          <div 
            key={stat.label} 
            className="p-3 md:p-5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors w-full sm:w-auto sm:flex-1 sm:max-w-[200px]"
          >
            <p className="text-[9px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-1 md:mb-2">
              {stat.label}
            </p>
            <p className="text-lg md:text-2xl font-semibold tracking-tight">
              {stat.value}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
              {stat.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
