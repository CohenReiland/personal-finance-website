export interface Subscription {
  name: string;
  amount: number;
  billingDay: number; // day of month (1-31) the subscription charges, recurring
  notes?: string;
  id?: string; // purely for Database reasons
}
