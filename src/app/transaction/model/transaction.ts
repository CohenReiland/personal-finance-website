export interface Transaction {
    id: string,
    Name: String,
    Category: TransactionCategory,
    Amount: number,
    Date: Date
    // type: string need to add this to make the amout either add or subtract
}

export type TransactionCategory = 'work' | 'personal' | 'Grocery' | 'Shopping' | 'Rent' | 'other';
