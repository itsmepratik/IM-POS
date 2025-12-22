"use client"

import { useMemo } from "react"
import { CreditCard, Banknote, Wallet, Smartphone } from "lucide-react"

interface PaymentTypeData {
  title: string
  description: string
  icon: React.ElementType
}

interface PaymentTypes {
  [key: string]: PaymentTypeData
}

export function usePaymentTypes() {
  // Payment metadata for UI display (icons, titles)
  const paymentDetailsData = useMemo<PaymentTypes>(() => {
    return {
      "Card": {
        title: "Card Payments",
        description: "Breakdown of all card payments",
        icon: CreditCard,
      },
      "Cash": {
        title: "Cash Payments",
        description: "Breakdown of all cash payments",
        icon: Banknote,
      },
      "Mobile Payments": {
        title: "Mobile Payments",
        description: "Breakdown of all mobile payment transactions",
        icon: Smartphone,
      },
      "Mobile Transfer": {
        title: "Mobile Transfers",
        description: "Breakdown of all mobile payment transfers",
        icon: Smartphone,
      },
      "Other": {
        title: "Other Payment Methods",
        description: "Breakdown of other payment methods",
        icon: Wallet,
      },
      "Credit": {
        title: "Credit Sales",
        description: "Transactions on credit",
        icon: Wallet,
      },
      "ON_HOLD": {
        title: "On Hold",
        description: "Transactions on hold",
        icon: Wallet,
      }
    }
  }, [])

  return { paymentDetailsData }
}
 