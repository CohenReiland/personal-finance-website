import { Routes } from '@angular/router';
import { TransactionList } from './transaction/transaction-list/transaction-list';

export const routes: Routes = [
    {
        path: 'transactions',
        component: TransactionList,
        title: 'transactions'
    }
];
