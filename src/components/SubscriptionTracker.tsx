import { useMemo } from 'react';
import { Transaction, FinanceStats } from '@/types/finance';
import { ExternalLink, AlertCircle, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  cancelUrl?: string;
}

// Common subscription services and their cancel URLs
const CANCEL_URLS: Record<string, string> = {
  'netflix': 'https://www.netflix.com/cancelplan',
  'spotify': 'https://www.spotify.com/account/subscription/',
  'hulu': 'https://secure.hulu.com/account',
  'disney': 'https://www.disneyplus.com/account/subscription',
  'disney+': 'https://www.disneyplus.com/account/subscription',
  'amazon prime': 'https://www.amazon.com/gp/primecentral',
  'prime video': 'https://www.amazon.com/gp/primecentral',
  'apple music': 'https://support.apple.com/en-us/HT202039',
  'apple tv': 'https://support.apple.com/en-us/HT202039',
  'icloud': 'https://support.apple.com/en-us/HT202039',
  'youtube': 'https://www.youtube.com/paid_memberships',
  'youtube premium': 'https://www.youtube.com/paid_memberships',
  'hbo': 'https://www.max.com/account',
  'max': 'https://www.max.com/account',
  'paramount': 'https://www.paramountplus.com/account/',
  'peacock': 'https://www.peacocktv.com/account',
  'adobe': 'https://account.adobe.com/plans',
  'microsoft': 'https://account.microsoft.com/services',
  'office 365': 'https://account.microsoft.com/services',
  'xbox': 'https://account.microsoft.com/services',
  'playstation': 'https://www.playstation.com/en-us/support/store/cancel-ps-store-subscription/',
  'ps plus': 'https://www.playstation.com/en-us/support/store/cancel-ps-store-subscription/',
  'nintendo': 'https://accounts.nintendo.com/family',
  'dropbox': 'https://www.dropbox.com/account/plan',
  'google one': 'https://one.google.com/settings/downgrade',
  'audible': 'https://www.audible.com/account/overview',
  'kindle': 'https://www.amazon.com/hz/mycd/myx',
  'gym': 'Contact your gym directly',
  'planet fitness': 'https://www.planetfitness.com/profile',
  'la fitness': 'Contact your gym directly',
  'linkedin': 'https://www.linkedin.com/mypreferences/d/categories/subscriptions',
  'linkedin premium': 'https://www.linkedin.com/mypreferences/d/categories/subscriptions',
  'chatgpt': 'https://chat.openai.com/account',
  'openai': 'https://platform.openai.com/account/billing',
  'notion': 'https://www.notion.so/my-account',
  'canva': 'https://www.canva.com/settings/subscriptions',
  'grammarly': 'https://account.grammarly.com/subscription',
  'nordvpn': 'https://my.nordaccount.com/dashboard/nordvpn/',
  'expressvpn': 'https://www.expressvpn.com/subscriptions',
  'slack': 'https://slack.com/intl/en-in/help/articles/360003222112-Cancel-your-Slack-subscription',
  'zoom': 'https://zoom.us/account',
  'doordash': 'https://www.doordash.com/consumer/membership/',
  'dashpass': 'https://www.doordash.com/consumer/membership/',
  'uber one': 'https://account.uber.com/uber-one',
  'uber eats': 'https://account.uber.com/uber-one',
  'instacart': 'https://www.instacart.com/store/account/instacart-plus',
  'headspace': 'https://www.headspace.com/settings/subscription',
  'calm': 'https://www.calm.com/settings',
  'peloton': 'https://members.onepeloton.com/settings/subscription',
  'strava': 'https://www.strava.com/settings/subscription',
  'duolingo': 'https://www.duolingo.com/settings/account',
  'coursera': 'https://www.coursera.org/user/subscriptions',
  'skillshare': 'https://www.skillshare.com/settings/payments',
};

function findCancelUrl(name: string): string | undefined {
  const lowerName = name.toLowerCase();
  for (const [key, url] of Object.entries(CANCEL_URLS)) {
    if (lowerName.includes(key)) {
      return url;
    }
  }
  // Generate a search URL as fallback
  return `https://www.google.com/search?q=cancel+${encodeURIComponent(name)}+subscription`;
}

const SubscriptionTracker = ({ transactions, stats }: SubscriptionTrackerProps) => {
  const currency = stats.currency || 'USD';

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
    
    // Group by merchant name (first 25 chars)
    const merchantMap = new Map<string, Transaction[]>();
    expenses.forEach(t => {
      const name = t.description.substring(0, 25).trim();
      const existing = merchantMap.get(name) || [];
      existing.push(t);
      merchantMap.set(name, existing);
    });

    // Identify subscriptions: 2+ transactions with similar amounts
    const subs: Subscription[] = [];
    
    merchantMap.forEach((txns, name) => {
      if (txns.length < 2) return;
      
      // Check if amounts are consistent (within 20% of each other)
      const amounts = txns.map(t => t.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const isConsistent = amounts.every(a => Math.abs(a - avgAmount) / avgAmount < 0.2);
      
      if (isConsistent || txns.length >= 3) {
        const paidSoFar = txns.reduce((sum, t) => sum + t.amount, 0);
        const monthlyAmount = avgAmount;
        
        subs.push({
          name,
          monthlyAmount,
          paidSoFar,
          count: txns.length,
          transactions: txns.sort((a, b) => b.date.getTime() - a.date.getTime()),
          annualProjection: monthlyAmount * 12,
          cancelUrl: findCancelUrl(name)
        });
      }
    });

    return subs.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
  }, [transactions]);

  const totalMonthly = useMemo(() => {
    return subscriptions.reduce((sum, sub) => sum + sub.monthlyAmount, 0);
  }, [subscriptions]);

  const totalPaidSoFar = useMemo(() => {
    return subscriptions.reduce((sum, sub) => sum + sub.paidSoFar, 0);
  }, [subscriptions]);

  const totalAnnual = useMemo(() => {
    return subscriptions.reduce((sum, sub) => sum + sub.annualProjection, 0);
  }, [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div className="mb-6 md:mb-8">
        <div className="p-4 md:p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground">
              Subscriptions
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            No recurring subscriptions detected. Upload more statements to identify patterns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 md:mb-8 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="p-3 md:p-5 rounded-lg border border-border bg-card">
          <p className="text-[9px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-1 md:mb-2">
            Monthly Cost
          </p>
          <p className="text-lg md:text-2xl font-semibold tracking-tight">
            {formatCurrency(totalMonthly)}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
            {subscriptions.length} subscriptions
          </p>
        </div>
        
        <div className="p-3 md:p-5 rounded-lg border border-border bg-card">
          <p className="text-[9px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-1 md:mb-2">
            Paid So Far
          </p>
          <p className="text-lg md:text-2xl font-semibold tracking-tight">
            {formatCurrency(totalPaidSoFar)}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
            in this period
          </p>
        </div>
        
        <div className="p-3 md:p-5 rounded-lg border border-border bg-card">
          <p className="text-[9px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-1 md:mb-2">
            Annual Projection
          </p>
          <p className="text-lg md:text-2xl font-semibold tracking-tight text-destructive">
            {formatCurrency(totalAnnual)}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
            if you continue
          </p>
        </div>
      </div>

      {/* Subscription List */}
      <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
        <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-3 md:mb-4">
          Active Subscriptions
        </p>
        <div className="space-y-3 md:space-y-4">
          {subscriptions.map((sub, idx) => {
            const percentOfTotal = (sub.monthlyAmount / totalMonthly) * 100;
            
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base font-medium truncate">{sub.name}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {sub.count} payments • {formatCurrency(sub.paidSoFar)} paid
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm md:text-base font-semibold">{formatCurrency(sub.monthlyAmount)}<span className="text-[10px] md:text-xs font-normal text-muted-foreground">/mo</span></p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {formatCurrency(sub.annualProjection)}/yr
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Progress value={percentOfTotal} className="h-1.5 flex-1" />
                  <span className="text-[9px] text-muted-foreground w-8">{percentOfTotal.toFixed(0)}%</span>
                  {sub.cancelUrl && (
                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] md:text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
                    >
                      Cancel <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Savings Tip */}
      {subscriptions.length >= 3 && (
        <div className="p-3 md:p-4 rounded-lg border border-border bg-muted/50">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs md:text-sm font-medium mb-1">Potential Savings</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                Canceling your lowest-used subscription could save you {formatCurrency(subscriptions[subscriptions.length - 1]?.monthlyAmount || 0)}/month 
                ({formatCurrency((subscriptions[subscriptions.length - 1]?.monthlyAmount || 0) * 12)}/year).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTracker;
