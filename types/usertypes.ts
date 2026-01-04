import mongoose from "mongoose";

interface INextOfKin {
  name: string;
  phoneNumber: string;
  address: string;
  image: string;
  email: string;
  userAccountNumber: string;
  userBankName: string;
  userAccountName: string;
}
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  bvnOrNin: string;
  role: string;
  country: string;
  state: string;
  lga: string;
  address: string;
  nextOfKin: INextOfKin;
  userAccountNumber: string;
  userBankName: string;
  userAccountName: string;
  image: string;
  dateOfRegistration: Date;
  lastLoginTime?: Date;
  favouriteProperties: mongoose.Types.ObjectId[];
  remainingBalance: number;
  isActive: boolean;
  emailToken: string;
  totalPropertyPurchased: number;
  totalPaymentMade: number;
  totalPaymentToBeMade: number;
  propertyUnderPayment: {
    title: string;
    userEmail: string;
    propertyId: mongoose.Types.ObjectId;
    propertyType: "House" | "Land" | "Farm" | "Commercial" | "Office" | "Shop";
    paymentMethod: "installment" | "payOnce";
    listingPurpose: "For Sale" | "For Renting";
    paymentHistory: {
      paymentDate: Date;
      nextPaymentDate: Date;
      amount: number;
      propertyPrice: number;
      totalPaymentMade: number;
      remainingBalance: number;
      paymentCompleted: boolean;
    }[];
  }[];
  propertyPurOrRented: {
    title: string;
    userEmail: string;
    propertyId: mongoose.Types.ObjectId;
    paymentDate: Date;
    propertyType: "House" | "Land" | "Farm" | "Commercial" | "Office" | "Shop";
    paymentMethod: "installment" | "payOnce";
    listingPurpose: "For Sale" | "For Renting";
    propertyPrice: number;
  }[];
  referralEarnings: number;
  numberOfReferrals: number;
}
