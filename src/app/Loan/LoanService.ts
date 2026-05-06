import { Injectable } from "@angular/core";
import { Loan } from "./LoanModel";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { FirebaseApp } from "firebase/app";
import { setDoc, updateDoc, deleteDoc, doc, collection, addDoc, getDoc, getDocs} from "firebase/firestore";
import { db } from "../firebase.config";
import { useDeviceLanguage } from "firebase/auth";


@Injectable({providedIn: 'root'})
export class LoanService{
        protected LoanError = '';

       private LoanCollection(uid: string){
        return collection(db, 'users', uid, 'loans');
       } 
       async CreateLoan(uid: string, loan: Loan): Promise<void> {
        await addDoc(this.LoanCollection(uid), loan);
       }
       async LoadLoans(uid: string): Promise<Loan[]>{
        const SubSnap = await getDocs(this.LoanCollection(uid));
        return SubSnap.docs.map(docSnap =>({
          id: docSnap.id,
          ...(docSnap.data() as Loan)
        }))
       }
       async LoadLoan(uid: string, LoanID: string): Promise<Loan | null> {
        const SubSnap = await getDoc(doc(db, 'users', uid, 'loan', LoanID));
        return SubSnap.exists() ? {id: SubSnap.id, ...(SubSnap.data() as Loan)} : null;
      }
       updateLoan(uid: string, LoanID: string, data: Partial<Loan>): Promise<void> {
        return updateDoc(doc(db, 'users', uid, 'loans', LoanID), data);
       }
       deleteLoan(uid: string, LoanID:string): Promise<void> {
        return deleteDoc(doc(db, 'users', uid, 'loan', LoanID));
       }
       //oh boy here is the behemoth
       LoanCalculation(loan: Loan){
        let n = 0;
        let IR = loan.interestRate; // NOTE: ENSURE THE LOAN IS THE MONTHLY INTEREST RATE
        let M = loan.monthlyPayment;
        let PT = loan.amount;
        
        let LoanNumerator = Math.log10(M / (M - (PT*IR)));
        let LoanDenominator = Math.log10(1 + IR);
        try{
        n = LoanNumerator / LoanDenominator
        } catch(error: unknown){
            this.LoanError = "Error! Payment too low or invalid interest rate";
        }
       }
    }