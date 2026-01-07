import { useMemo } from 'react';
import { Transaction, FinanceStats } from '@/types/finance';

interface ImpulseScoreProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

const ImpulseScore = ({ transactions, stats }: ImpulseScoreProps) => {
  const currency = stats.currency || 'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const impulseAnalysis = useMemo(() => {
    const expenses = transactions.filter(t => !t.isIncome);
    if (expenses.length < 5) return null;

    // Define impulse thresholds based on transaction patterns
    const avgTransaction = stats.avgPerTransaction || 0;
    const impulseThreshold = Math.min(avgTransaction * 0.3, 25); // Small relative purchases
    
    // Identify impulse purchases: small, frequent transactions
    const impulsePurchases = expenses.filter(t => t.amount <= impulseThreshold);
    const impulseTotal = impulsePurchases.reduce((sum, t) => sum + t.amount, 0);
    const impulsePercentage = stats.totalSpent > 0 ? (impulseTotal / stats.totalSpent) * 100 : 0;
    
    // Calculate impulse score (0-100)
    // Based on: frequency of small purchases + percentage of total spend
    const frequencyScore = Math.min((impulsePurchases.length / expenses.length) * 100, 50);
    const percentageScore = Math.min(impulsePercentage, 50);
    const impulseScore = Math.round(frequencyScore + percentageScore);
    
    // Identify repeated small merchants (habitual impulse)
    const merchantCounts = new Map<string, number>();
    impulsePurchases.forEach(t => {
      const name = t.description.substring(0, 20).toLowerCase();
      merchantCounts.set(name, (merchantCounts.get(name) || 0) + 1);
    });
    
    const habitualMerchants = Array.from(merchantCounts.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Score interpretation
    let interpretation = '';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (impulseScore < 25) {
      interpretation = 'Disciplined spender';
      riskLevel = 'low';
    } else if (impulseScore < 50) {
      interpretation = 'Moderate impulse tendency';
      riskLevel = 'medium';
    } else {
      interpretation = 'High impulse spending';
      riskLevel = 'high';
    }

    return {
      score: impulseScore,
      impulseCount: impulsePurchases.length,
      impulseTotal,
      impulsePercentage,
      threshold: impulseThreshold,
      habitualMerchants,
      interpretation,
      riskLevel
    };
  }, [transactions, stats]);

  if (!impulseAnalysis) return null;

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-foreground/60';
      case 'medium': return 'text-foreground/80';
      case 'high': return 'text-foreground';
    }
  };

  return (
    <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
      <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
        Impulse Score
      </p>
      
      <div className="flex items-start gap-4">
        {/* Score circle */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="stroke-muted"
              fill="none"
              strokeWidth="3"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="stroke-foreground transition-all duration-500"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${impulseAnalysis.score}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg md:text-xl font-semibold">{impulseAnalysis.score}</span>
          </div>
        </div>
        
        {/* Details */}
        <div className="flex-1 space-y-2">
          <p className={`text-sm font-medium ${getRiskColor(impulseAnalysis.riskLevel)}`}>
            {impulseAnalysis.interpretation}
          </p>
          <div className="space-y-1 text-[10px] md:text-xs text-muted-foreground">
            <p>
              {impulseAnalysis.impulseCount} small purchases under {formatCurrency(impulseAnalysis.threshold)}
            </p>
            <p>
              {formatCurrency(impulseAnalysis.impulseTotal)} total ({impulseAnalysis.impulsePercentage.toFixed(0)}% of spending)
            </p>
          </div>
        </div>
      </div>
      
      {/* Habitual merchants */}
      {impulseAnalysis.habitualMerchants.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[9px] md:text-[10px] text-muted-foreground mb-2">Frequent small purchases at:</p>
          <div className="flex flex-wrap gap-1.5">
            {impulseAnalysis.habitualMerchants.map(([name, count], idx) => (
              <span key={idx} className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-muted">
                {name.substring(0, 15)} ({count}x)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpulseScore;
