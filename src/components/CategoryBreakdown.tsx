import { CategoryData } from '@/types/finance';

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

const CategoryBreakdown = ({ categories }: CategoryBreakdownProps) => {
  const maxTotal = Math.max(...categories.map(c => c.total));

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((category) => {
          const progressWidth = (category.total / maxTotal) * 100;
          const topTransactions = category.transactions.slice(0, 3);
          
          // Parse color for border
          const colorMatch = category.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
          let borderColor = category.color;
          
          if (colorMatch) {
            const [, h] = colorMatch;
            borderColor = `hsl(${h}, 60%, 50%)`;
          }

          return (
            <div
              key={category.name}
              className="category-card"
              style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.transactions.length} transaction{category.transactions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(category.total)}</p>
                  <p className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressWidth}%`,
                    backgroundColor: borderColor
                  }}
                />
              </div>

              {/* Top transactions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Top Transactions
                </p>
                {topTransactions.map((txn, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2 text-muted-foreground">
                      {txn.description.length > 25 
                        ? txn.description.substring(0, 25) + '...' 
                        : txn.description}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      {formatCurrency(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
