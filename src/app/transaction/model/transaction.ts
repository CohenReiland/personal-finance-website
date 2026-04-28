export interface Transaction {
    id: string,
    Name: String,
    Category: TransactionCategory,
    Amount: number,
    Date: Date
}

export type TransactionCategory = 'work' | 'personal' | 'Grocery' | 'Shopping' | 'Rent' | 'other';