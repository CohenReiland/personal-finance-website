import { Injectable } from "@angular/core";
import { Loan } from "../models/loan";
import { setDoc, updateDoc, deleteDoc, doc, collection, addDoc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";

@Injectable({providedIn: 'root'})
export class LoanService{
       private LoanCollection(uid: string){
        return collection(db, 'users', uid, 'loans');
       }
       async CreateLoan(uid: string, loan: Loan): Promise<void> {
        await addDoc(this.LoanCollection(uid), loan);
       }
       async LoadLoans(uid: string): Promise<Loan[]>{
        const LoanSnap = await getDocs(this.LoanCollection(uid));
        return LoanSnap.docs.map(docSnap =>({
          id: docSnap.id,
          ...(docSnap.data() as Loan)
        }))
       }
       async LoadLoan(uid: string, LoanID: string): Promise<Loan | null> {
        const LoanSnap = await getDoc(doc(db, 'users', uid, 'loans', LoanID));
        return LoanSnap.exists() ? {id: LoanSnap.id, ...(LoanSnap.data() as Loan)} : null;
      }
       updateLoan(uid: string, LoanID: string, data: Partial<Loan>): Promise<void> {
        return updateDoc(doc(db, 'users', uid, 'loans', LoanID), data);
       }
       deleteLoan(uid: string, LoanID:string): Promise<void> {
        return deleteDoc(doc(db, 'users', uid, 'loans', LoanID));
       }
       LoanCalculation(loan: Loan): number | null {
        const IR = loan.interestRate; // monthly interest rate as a decimal
        const M = loan.monthlyPayment;
        const PT = loan.amount;

        if (!IR || !M || !PT) return null;

        const numerator = Math.log10(M / (M - (PT * IR)));
        const denominator = Math.log10(1 + IR);

        const n = numerator / denominator;
        return isFinite(n) ? n : null;
       }
    }
