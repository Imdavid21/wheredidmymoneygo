import { FinanceStats } from '@/types/finance';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Wallet, TrendingDown } from 'lucide-react';

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

  const creditUsagePercent = isCreditCard && balanceInfo.creditLimit 
    ? ((balanceInfo.creditUsed || 0) / balanceInfo.creditLimit) * 100 
    : 0;

  return (
    <div className="mb-6 md:mb-8">
      {/* Balance Card - only if we have balance info */}
      {balanceInfo && (isCreditCard || isBank || balanceInfo.type === 'other') && (
        <div className="p-4 md:p-5 rounded-lg border border-border bg-card mb-4">
          {isCreditCard && balanceInfo.creditLimit && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Credit Card</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{formatCurrency(balanceInfo.creditUsed || 0)}</span>
                <span className="text-sm text-muted-foreground">of {formatCurrency(balanceInfo.creditLimit)}</span>
              </div>
              <Progress value={creditUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(balanceInfo.availableCredit || 0)} available
              </p>
            </div>
          )}
          
          {(isBank || balanceInfo.type === 'other') && (balanceInfo.openingBalance !== undefined || balanceInfo.closingBalance !== undefined) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {isBank ? 'Bank Account' : 'Account'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                {balanceInfo.openingBalance !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Opening</p>
                    <p className="text-lg font-semibold">{formatCurrency(balanceInfo.openingBalance)}</p>
                  </div>
                )}
                {balanceInfo.closingBalance !== undefined && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Closing</p>
                    <p className="text-lg font-semibold">{formatCurrency(balanceInfo.closingBalance)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spending Summary */}
      <div className="p-4 md:p-5 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Spending Summary</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl md:text-3xl font-bold">{formatCurrency(stats.totalSpent)}</p>
            <p className="text-xs text-muted-foreground">{stats.spentCount} transactions</p>
          </div>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-semibold text-muted-foreground">{formatCurrency(stats.avgPerTransaction)}</p>
            <p className="text-xs text-muted-foreground">avg per txn</p>
          </div>
          <div className="text-right">
            <p className="text-xl md:text-2xl font-semibold text-muted-foreground">{formatCurrency(stats.recurringCharges)}</p>
            <p className="text-xs text-muted-foreground">{stats.recurringCount} recurring</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
