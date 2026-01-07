export interface Transaction {
  date: Date;
  description: string;
  amount: number;
  category: string;
  isIncome: boolean;
}

export interface CategoryData {
  name: string;
  total: number;
  percentage: number;
  transactions: Transaction[];
  color: string;
}

export interface FinanceStats {
  totalIncome: number;
  incomeCount: number;
  totalSpent: number;
  spentCount: number;
  recurringCharges: number;
  recurringCount: number;
  avgPerTransaction: number;
}

export interface ParsedData {
  transactions: Transaction[];
  categories: CategoryData[];
  stats: FinanceStats;
}
