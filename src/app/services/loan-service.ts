import { Injectable } from '@angular/core';
import { Loan } from '../models/loan';
import { updateDoc, deleteDoc, doc, collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.config';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private loanCollection(uid: string) {
    return collection(db, 'users', uid, 'loans');
  }
  async createLoan(uid: string, loan: Loan): Promise<void> {
    await addDoc(this.loanCollection(uid), loan);
  }
  async loadLoans(uid: string): Promise<Loan[]> {
    const loanSnap = await getDocs(this.loanCollection(uid));
    return loanSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Loan),
    }));
  }
  updateLoan(uid: string, loanId: string, data: Partial<Loan>): Promise<void> {
    return updateDoc(doc(db, 'users', uid, 'loans', loanId), data);
  }
  deleteLoan(uid: string, loanId: string): Promise<void> {
    return deleteDoc(doc(db, 'users', uid, 'loans', loanId));
  }
  loanCalculation(loan: Loan): number | null {
    const IR = loan.interestRate; // monthly interest rate as a decimal
    const M = loan.monthlyPayment;
    const PT = loan.amount;

    if (!IR || !M || !PT) return null;

    const numerator = Math.log10(M / (M - PT * IR));
    const denominator = Math.log10(1 + IR);

    const n = numerator / denominator;
    return isFinite(n) ? n : null;
  }
}
