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

export interface IncomeSource {
  name: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

export type StatementType = 'credit_card' | 'bank' | 'other';

export interface BalanceInfo {
  type: StatementType;
  // Credit card
  creditLimit?: number;
  creditUsed?: number;
  availableCredit?: number;
  // Bank / Other
  openingBalance?: number;
  closingBalance?: number;
}

export interface FinanceStats {
  totalIncome: number;
  incomeCount: number;
  totalSpent: number;
  spentCount: number;
  recurringCharges: number;
  recurringCount: number;
  avgPerTransaction: number;
  currency: string;
  balanceInfo?: BalanceInfo;
}

export interface ParsedData {
  transactions: Transaction[];
  categories: CategoryData[];
  incomeSources: IncomeSource[];
  stats: FinanceStats;
  sourceFiles?: string[];
}

export interface DailySpending {
  date: string;
  amount: number;
  dayOfWeek: string;
}

export interface WeekdayPattern {
  day: string;
  average: number;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TopMerchant {
  name: string;
  total: number;
  count: number;
  avgTransaction: number;
}

export interface AIAnalysisResult {
  currency: string;
  statementType: StatementType;
  balanceInfo?: {
    creditLimit?: number;
    creditUsed?: number;
    availableCredit?: number;
    openingBalance?: number;
    closingBalance?: number;
  };
  categories?: string[];
  transactions: {
    date: string;
    description: string;
    amount: number;
    category?: string;
  }[];
}
