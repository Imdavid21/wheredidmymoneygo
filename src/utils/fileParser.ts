import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { Transaction, CategoryData, FinanceStats, ParsedData } from '@/types/finance';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': [
    'restaurant', 'cafe', 'coffee', 'doordash', 'ubereats', 'grubhub', 'grocery',
    'starbucks', 'chipotle', 'safeway', 'whole foods', 'trader joe', 'mcdonald',
    'burger', 'pizza', 'taco', 'sushi', 'diner', 'bakery', 'food', 'eat', 'kitchen'
  ],
  'Subscriptions': [
    'netflix', 'spotify', 'hulu', 'disney', 'prime', 'gym', 'membership',
    'fitness', 'youtube', 'apple music', 'adobe', 'subscription', 'monthly'
  ],
  'Shopping': [
    'amazon', 'walmart', 'target', 'best buy', 'costco', 'ebay', 'etsy',
    'shop', 'store', 'retail', 'mall', 'clothing', 'apparel'
  ],
  'Transport': [
    'uber', 'lyft', 'gas', 'parking', 'shell', 'chevron', 'exxon', 'bp',
    'transit', 'metro', 'subway', 'bus', 'toll', 'car wash', 'fuel'
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
  const hue = (index * 360 / Math.max(total, 1)) % 360;
  return `hsl(${hue}, 55%, 60%)`;
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

function processRows(rows: Record<string, string>[]): Transaction[] {
  const transactions: Transaction[] = [];
  
  for (const row of rows) {
    const amountStr = findField(row, ['amount', 'transaction amount', 'total']);
    const debitStr = findField(row, ['debit', 'withdrawal']);
    const creditStr = findField(row, ['credit', 'deposit']);
    const dateStr = findField(row, ['date', 'transaction date', 'posted date', 'post date']);
    const descStr = findField(row, ['description', 'merchant', 'name', 'memo', 'payee', 'details']);
    
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
  
  return transactions;
}

function calculateStats(transactions: Transaction[]): { stats: FinanceStats; categories: CategoryData[] } {
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
  
  return { stats, categories };
}

export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions = processRows(results.data as Record<string, string>[]);
          const { stats, categories } = calculateStats(transactions);
          resolve({ transactions, categories, stats });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });
}

export async function parseXLSX(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { raw: false });
        
        const transactions = processRows(rows);
        const { stats, categories } = calculateStats(transactions);
        resolve({ transactions, categories, stats });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function parsePDF(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }
        
        // Try to extract transactions from PDF text
        const lines = fullText.split('\n').filter(line => line.trim());
        const rows: Record<string, string>[] = [];
        
        // Simple pattern matching for common bank statement formats
        const amountPattern = /\$?-?[\d,]+\.?\d*/g;
        const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
        
        for (const line of lines) {
          const amounts = line.match(amountPattern);
          const dates = line.match(datePattern);
          
          if (amounts && amounts.length > 0) {
            const amount = amounts[amounts.length - 1];
            const date = dates?.[0] || '';
            const description = line
              .replace(amountPattern, '')
              .replace(datePattern, '')
              .trim();
            
            if (description && amount) {
              rows.push({
                Date: date,
                Description: description,
                Amount: amount
              });
            }
          }
        }
        
        const transactions = processRows(rows);
        const { stats, categories } = calculateStats(transactions);
        resolve({ transactions, categories, stats });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseXLSX(file);
    case 'pdf':
      return parsePDF(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}
