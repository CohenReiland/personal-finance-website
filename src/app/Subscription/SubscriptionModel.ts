export interface Subscription {
    name: string,
    amount: number,
    renewalDate: string,
    notes?: string,
    id?: string // purely for Database reasons
}