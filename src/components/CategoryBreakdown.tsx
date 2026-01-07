import { useState } from 'react';
import { CategoryData } from '@/types/finance';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CategoryBreakdownProps {
  categories: CategoryData[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const CategoryCard = ({ category, maxTotal }: { category: CategoryData; maxTotal: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const progressWidth = (category.total / maxTotal) * 100;
  const topTransactions = category.transactions.slice(0, 5);

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
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-sm font-medium truncate">{category.name}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(category.total)}</p>
                <p className="text-[10px] text-muted-foreground">{category.percentage.toFixed(1)}%</p>
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
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                {category.transactions.length} transaction{category.transactions.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isOpen ? 'Hide' : 'Show'} details
              </span>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
              Top transactions
            </p>
            <div className="space-y-1.5">
              {topTransactions.map((txn, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs gap-2">
                  <span className="truncate text-muted-foreground">
                    {txn.description}
                  </span>
                  <span className="font-medium shrink-0 tabular-nums">
                    {formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
              {category.transactions.length > 5 && (
                <p className="text-[10px] text-muted-foreground pt-1">
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

const CategoryBreakdown = ({ categories }: CategoryBreakdownProps) => {
  const maxTotal = Math.max(...categories.map(c => c.total));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Categories</h2>
        <span className="text-xs text-muted-foreground">Click to expand</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((category) => (
          <CategoryCard 
            key={category.name} 
            category={category} 
            maxTotal={maxTotal}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
