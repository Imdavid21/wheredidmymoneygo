import Papa from 'papaparse';
import { Transaction, CategoryData, FinanceStats, ParsedData } from '@/types/finance';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': [
    'restaurant', 'cafe', 'coffee', 'doordash', 'ubereats', 'grubhub', 'grocery',
    'starbucks', 'chipotle', 'safeway', 'whole foods', 'trader joe', 'mcdonald',
    'burger', 'pizza', 'taco', 'sushi', 'diner', 'bakery', 'food', 'eat'
  ],
  'Subscriptions': [
    'netflix', 'spotify', 'hulu', 'disney', 'prime', 'gym', 'membership',
    'fitness', 'youtube', 'apple music', 'adobe', 'subscription', 'monthly'
  ],
  'Shopping': [
    'amazon', 'walmart', 'target', 'best buy', 'costco', 'ebay', 'etsy',
    'shop', 'store', 'retail', 'mall'
  ],
  'Transport': [
    'uber', 'lyft', 'gas', 'parking', 'shell', 'chevron', 'exxon', 'bp',
    'transit', 'metro', 'subway', 'bus', 'toll', 'car wash'
  ],
  'Utilities': [
    'electric', 'water', 'internet', 'phone', 'verizon', 'at&t', 'comcast',
    'edison', 'bill', 'utility', 'pge', 'spectrum', 'xfinity', 't-mobile'
  ],
  'Entertainment': [
    'movie', 'theater', 'theatre', 'game', 'steam', 'concert', 'playstation',
    'xbox', 'nintendo', 'hotel', 'airbnb', 'travel', 'ticket', 'amc'
  ],
  'Health': [
    'pharmacy', 'doctor', 'cvs', 'walgreens', 'medical', 'hospital', 'clinic',
    'dental', 'vision', 'health', 'rx', 'prescription'
  ],
  'Housing': [
    'rent', 'mortgage', 'apartment', 'lease', 'hoa', 'property'
  ]
};

function categorizeTransaction(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}

function generateCategoryColor(index: number, total: number): string {
  const hue = (index * 360 / total) % 360;
  return `hsl(${hue}, 60%, 65%)`;
}

function findField(row: Record<string, string>, fieldNames: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const fieldName of fieldNames) {
    const key = keys.find(k => k.toLowerCase().includes(fieldName.toLowerCase()));
    if (key && row[key]) {
      return row[key];
    }
  }
  return undefined;
}

function parseAmount(amountStr: string | undefined, debitStr?: string, creditStr?: string): number | null {
  if (debitStr || creditStr) {
    const debit = parseFloat(debitStr?.replace(/[^0-9.-]/g, '') || '0');
    const credit = parseFloat(creditStr?.replace(/[^0-9.-]/g, '') || '0');
    if (!isNaN(debit) && debit > 0) return -debit;
    if (!isNaN(credit) && credit > 0) return credit;
  }
  
  if (amountStr) {
    const cleaned = amountStr.replace(/[^0-9.-]/g, '');
    const amount = parseFloat(cleaned);
    if (!isNaN(amount)) return amount;
  }
  
  return null;
}

export function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = [];
          
          for (const row of results.data as Record<string, string>[]) {
            const amountStr = findField(row, ['amount', 'transaction amount']);
            const debitStr = findField(row, ['debit', 'withdrawal']);
            const creditStr = findField(row, ['credit', 'deposit']);
            const dateStr = findField(row, ['date', 'transaction date', 'posted date', 'post date']);
            const descStr = findField(row, ['description', 'merchant', 'name', 'memo', 'payee']);
            
            const amount = parseAmount(amountStr, debitStr, creditStr);
            
            if (amount === null || !descStr) continue;
            
            let date: Date;
            if (dateStr) {
              date = new Date(dateStr);
              if (isNaN(date.getTime())) {
                date = new Date();
              }
            } else {
              date = new Date();
            }
            
            const isIncome = amount > 0;
            const category = isIncome ? 'Income' : categorizeTransaction(descStr);
            
            transactions.push({
              date,
              description: descStr.trim(),
              amount: Math.abs(amount),
              category,
              isIncome
            });
          }
          
          // Calculate stats
          const incomeTransactions = transactions.filter(t => t.isIncome);
          const expenseTransactions = transactions.filter(t => !t.isIncome);
          
          const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
          const totalSpent = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
          
          // Detect recurring charges
          const merchantCounts: Record<string, { count: number; total: number }> = {};
          for (const t of expenseTransactions) {
            const key = t.description.substring(0, 15).toLowerCase();
            if (!merchantCounts[key]) {
              merchantCounts[key] = { count: 0, total: 0 };
            }
            merchantCounts[key].count++;
            merchantCounts[key].total += t.amount;
          }
          
          let recurringCharges = 0;
          let recurringCount = 0;
          for (const [, data] of Object.entries(merchantCounts)) {
            if (data.count >= 2) {
              recurringCharges += data.total / data.count;
              recurringCount++;
            }
          }
          
          const stats: FinanceStats = {
            totalIncome,
            incomeCount: incomeTransactions.length,
            totalSpent,
            spentCount: expenseTransactions.length,
            recurringCharges,
            recurringCount,
            avgPerTransaction: expenseTransactions.length > 0 
              ? totalSpent / expenseTransactions.length 
              : 0
          };
          
          // Group by category
          const categoryMap = new Map<string, Transaction[]>();
          for (const t of expenseTransactions) {
            const existing = categoryMap.get(t.category) || [];
            existing.push(t);
            categoryMap.set(t.category, existing);
          }
          
          const categories: CategoryData[] = [];
          let colorIndex = 0;
          const totalCategories = categoryMap.size;
          
          const sortedCategories = Array.from(categoryMap.entries())
            .sort((a, b) => {
              const totalA = a[1].reduce((sum, t) => sum + t.amount, 0);
              const totalB = b[1].reduce((sum, t) => sum + t.amount, 0);
              return totalB - totalA;
            });
          
          for (const [name, txns] of sortedCategories) {
            const total = txns.reduce((sum, t) => sum + t.amount, 0);
            const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
            
            categories.push({
              name,
              total,
              percentage,
              transactions: txns.sort((a, b) => b.amount - a.amount),
              color: generateCategoryColor(colorIndex, totalCategories)
            });
            
            colorIndex++;
          }
          
          resolve({ transactions, categories, stats });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
