export interface Transaction {
    id?: string,
    transactionId?: string,
    Name: string,
    Category: TransactionCategory,
    Amount: number,
    Date: Date,
    Type: ExpenseType
}

export type TransactionCategory = 'work' | 'personal' | 'Grocery' | 'Shopping' | 'Rent' | 'other';

export type ExpenseType = 'Income' | 'Expense'