import { useMemo, useState, useEffect } from 'react';
import { Transaction, FinanceStats } from '@/types/finance';
import { ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionTrackerProps {
  transactions: Transaction[];
  stats: FinanceStats;
}

interface Subscription {
  name: string;
  monthlyAmount: number;
  paidSoFar: number;
  count: number;
  transactions: Transaction[];
  annualProjection: number;
}

interface CancelInfo {
  isSubscription: boolean;
  serviceName: string | null;
  url: string | null;
  instruction: string | null;
  confidence: 'high' | 'medium' | 'low';
  loading?: boolean;
}

const SubscriptionTracker = ({ transactions, stats }: SubscriptionTrackerProps) => {
  const currency = stats.currency || 'USD';
  const [cancelLinks, setCancelLinks] = useState<Record<string, CancelInfo>>({});
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const subscriptions = useMemo((): Subscription[] => {
    const expenses = transactions.filter(t => !t.isIncome);
    
    const merchantMap = new Map<string, Transaction[]>();
    expenses.forEach(t => {
      const name = t.description.substring(0, 25).trim();
      const existing = merchantMap.get(name) || [];
      existing.push(t);
      merchantMap.set(name, existing);
    });

    const subs: Subscription[] = [];
    
    merchantMap.forEach((txns, name) => {
      if (txns.length < 2) return;
      
      const amounts = txns.map(t => t.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const isConsistent = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.2);
      
      if (isConsistent || txns.length >= 3) {
        const paidSoFar = txns.reduce((sum, t) => sum + t.amount, 0);
        
        subs.push({
          name,
          monthlyAmount: avgAmount,
          paidSoFar,
          count: txns.length,
          transactions: txns.sort((a, b) => b.date.getTime() - a.date.getTime()),
          annualProjection: avgAmount * 12,
        });
      }
    });

    return subs.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
  }, [transactions]);

  // Fetch cancel links for subscriptions
  useEffect(() => {
    const fetchCancelLinks = async () => {
      for (const sub of subscriptions.slice(0, 10)) {
        if (cancelLinks[sub.name]) continue;
        
        setCancelLinks(prev => ({
          ...prev,
          [sub.name]: { isSubscription: true, serviceName: null, url: null, instruction: null, confidence: 'low', loading: true }
        }));

        try {
          const { data, error } = await supabase.functions.invoke('find-cancel-link', {
            body: { subscriptionName: sub.name }
          });

          if (!error && data) {
            setCancelLinks(prev => ({
              ...prev,
              [sub.name]: { ...data, loading: false }
            }));
          } else {
            setCancelLinks(prev => ({
              ...prev,
              [sub.name]: { isSubscription: false, serviceName: null, url: null, instruction: 'Search online', confidence: 'low', loading: false }
            }));
          }
        } catch {
          setCancelLinks(prev => ({
            ...prev,
            [sub.name]: { isSubscription: false, serviceName: null, url: null, instruction: 'Search online', confidence: 'low', loading: false }
          }));
        }
      }
    };

    if (subscriptions.length > 0) {
      fetchCancelLinks();
    }
  }, [subscriptions]);

  // Filter to only show confirmed subscriptions (or still loading)
  const confirmedSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const info = cancelLinks[sub.name];
      // Show if: still loading, not yet checked, or confirmed as subscription
      return !info || info.loading || info.isSubscription;
    });
  }, [subscriptions, cancelLinks]);

  const totalMonthly = useMemo(() => {
    return confirmedSubscriptions.reduce((sum, sub) => sum + sub.monthlyAmount, 0);
  }, [confirmedSubscriptions]);

  const totalAnnual = useMemo(() => {
    return confirmedSubscriptions.reduce((sum, sub) => sum + sub.annualProjection, 0);
  }, [confirmedSubscriptions]);

  if (confirmedSubscriptions.length === 0 && Object.keys(cancelLinks).length > 0) {
    // All checked and none are subscriptions
    return null;
  }

  if (subscriptions.length === 0) {
    return null;
  }

  const displaySubs = expanded ? confirmedSubscriptions : confirmedSubscriptions.slice(0, 5);

  return (
    <div className="mb-6 md:mb-8">
      <div className="p-4 md:p-6 rounded-lg border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm md:text-base font-semibold">Subscriptions</h2>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {confirmedSubscriptions.length} subscriptions detected
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg md:text-xl font-bold">{formatCurrency(totalMonthly)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
            <p className="text-[10px] md:text-xs text-muted-foreground">{formatCurrency(totalAnnual)}/year</p>
          </div>
        </div>

        {/* Subscription List */}
        <div className="space-y-3">
          {displaySubs.map((sub, idx) => {
            const cancelInfo = cancelLinks[sub.name];
            const displayName = cancelInfo?.serviceName || sub.name;
            
            return (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sub.count} payments • {formatCurrency(sub.paidSoFar)} paid
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(sub.monthlyAmount)}</p>
                  </div>
                  
                  {cancelInfo?.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : cancelInfo?.url ? (
                    <a
                      href={cancelInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      title={cancelInfo.instruction || 'Cancel subscription'}
                    >
                      Cancel <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : cancelInfo?.instruction ? (
                    <span className="text-[10px] text-muted-foreground max-w-[80px] truncate" title={cancelInfo.instruction}>
                      {cancelInfo.instruction}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand/Collapse */}
        {confirmedSubscriptions.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 pt-3 border-t border-border flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Show {confirmedSubscriptions.length - 5} more <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTracker;
