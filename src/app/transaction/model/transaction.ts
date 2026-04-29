export interface Transaction {
    id: string,
    Name: String,
    Category: TransactionCategory,
    Amount: number,
    Date: Date,
    Type: ExpenseType
}

export type TransactionCategory = 'work' | 'personal' | 'Grocery' | 'Shopping' | 'Rent' | 'other';

export type ExpenseType = 'Income' | 'Expense'