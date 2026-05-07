export interface Transaction {
    id?: string,
    transactionId?: string,
    userId?: string,
    Name: string,
    Category: TransactionCategory,
    Amount: number,
    Date: Date,
    Type: ExpenseType
}

export type TransactionCategory = 'Salary' | 'Personal' | 'Grocery' | 'Shopping' | 'Rent' | 'Other';

export type ExpenseType = 'Income' | 'Expense'