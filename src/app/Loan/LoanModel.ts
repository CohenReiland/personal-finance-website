export interface Loan {
    name: string,
    amount: number,
    lastPaidDate: string,
    interestRate: number,
    monthlyPayment: number,
    notes?: string,
    id?: string,
}