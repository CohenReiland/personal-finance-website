export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly';
  createdAt: Date;
  updatedAt: Date;
}

/*status to be computed in the service itself*/

export type BudgetStatus = 'OK' | 'CAUTION' | 'BREACH';

export interface BudgetWithDerived extends Budget {
  percentUsed: number;
  remaining: number;
  status: BudgetStatus;
}
