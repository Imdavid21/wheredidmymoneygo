import { useState } from 'react';
import { CategoryData, FinanceStats } from '@/types/finance';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CategoryBreakdownProps {
  categories: CategoryData[];
  stats: FinanceStats;
}

const CategoryCard = ({ 
  category, 
  maxTotal,
  currency 
}: { 
  category: CategoryData; 
  maxTotal: number;
  currency: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const progressWidth = (category.total / maxTotal) * 100;
  const topTransactions = category.transactions.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const colorMatch = category.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  let accentColor = category.color;
  
  if (colorMatch) {
    const [, h] = colorMatch;
    accentColor = `hsl(${h}, 50%, 50%)`;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-card overflow-hidden hover:bg-muted/20 transition-colors">
        <CollapsibleTrigger className="w-full text-left">
          <div className="p-3 md:p-4">
            <div className="flex items-start justify-between gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                <div 
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-xs md:text-sm font-medium truncate">{category.name}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs md:text-sm font-semibold">{formatCurrency(category.total)}</p>
                <p className="text-[9px] md:text-[10px] text-muted-foreground">{category.percentage.toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressWidth}%`,
                  backgroundColor: accentColor
                }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-1.5 md:mt-2">
              <span className="text-[9px] md:text-[10px] text-muted-foreground">
                {category.transactions.length} txn{category.transactions.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[9px] md:text-[10px] text-muted-foreground">
                {isOpen ? 'Hide' : 'Details'}
              </span>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 md:px-4 pb-3 md:pb-4 border-t border-border pt-2 md:pt-3">
            <p className="text-[9px] md:text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 md:mb-2">
              Top transactions
            </p>
            <div className="space-y-1 md:space-y-1.5">
              {topTransactions.map((txn, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] md:text-xs gap-2">
                  <span className="truncate text-muted-foreground">
                    {txn.description}
                  </span>
                  <span className="font-medium shrink-0 tabular-nums">
                    {formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
              {category.transactions.length > 5 && (
                <p className="text-[9px] md:text-[10px] text-muted-foreground pt-0.5 md:pt-1">
                  +{category.transactions.length - 5} more
                </p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const CategoryBreakdown = ({ categories, stats }: CategoryBreakdownProps) => {
  const maxTotal = Math.max(...categories.map(c => c.total));
  const currency = stats.currency || 'USD';

  return (
    <div>
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h2 className="text-xs md:text-sm font-medium">Categories</h2>
        <span className="text-[10px] md:text-xs text-muted-foreground">Tap to expand</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard 
            key={category.name} 
            category={category} 
            maxTotal={maxTotal}
            currency={currency}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
