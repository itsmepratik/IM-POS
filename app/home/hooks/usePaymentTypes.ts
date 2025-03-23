"use client"

import { useMemo } from "react"
import { CreditCard, Banknote, Wallet, Smartphone, Building } from "lucide-react"

interface PaymentTransaction {
  id: string
  date: string
  amount: string
  method: string
}

interface PaymentStat {
  label: string
  value: string
}

interface PaymentTypeData {
  title: string
  description: string
  icon: React.ElementType
  transactions: PaymentTransaction[]
  stats: PaymentStat[]
}

interface PaymentTypes {
  [key: string]: PaymentTypeData
}

export function usePaymentTypes() {
  // Mock payment details data
  const paymentDetailsData = useMemo<PaymentTypes>(() => {
    return {
      "Card": {
        title: "Card Payments",
        description: "Breakdown of all card payments",
        icon: CreditCard,
        transactions: [
          { id: "tx-001", date: "2023-12-31", amount: "OMR 2,345.67", method: "Visa" },
          { id: "tx-002", date: "2023-12-31", amount: "OMR 1,987.54", method: "Mastercard" },
          { id: "tx-003", date: "2023-12-30", amount: "OMR 1,456.78", method: "Amex" },
          { id: "tx-004", date: "2023-12-30", amount: "OMR 2,876.45", method: "Visa" },
          { id: "tx-005", date: "2023-12-29", amount: "OMR 1,210.10", method: "Mastercard" },
          { id: "tx-006", date: "2023-12-29", amount: "OMR 1,845.22", method: "Visa" },
          { id: "tx-007", date: "2023-12-28", amount: "OMR 2,112.55", method: "Mastercard" },
          { id: "tx-008", date: "2023-12-28", amount: "OMR 1,678.90", method: "Visa" },
          { id: "tx-009", date: "2023-12-27", amount: "OMR 3,421.30", method: "Amex" },
          { id: "tx-010", date: "2023-12-27", amount: "OMR 1,932.18", method: "Visa" },
          { id: "tx-011", date: "2023-12-26", amount: "OMR 1,756.50", method: "Mastercard" },
          { id: "tx-012", date: "2023-12-26", amount: "OMR 2,450.75", method: "Visa" },
          { id: "tx-013", date: "2023-12-25", amount: "OMR 1,890.22", method: "Amex" },
          { id: "tx-014", date: "2023-12-25", amount: "OMR 2,165.87", method: "Visa" },
          { id: "tx-015", date: "2023-12-24", amount: "OMR 1,342.99", method: "Mastercard" },
        ],
        stats: [
          { label: "Average transaction", value: "OMR 1,975.31" },
          { label: "Most common card", value: "Visa (60%)" },
          { label: "Highest transaction", value: "OMR 3,421.30" }
        ]
      },
      "Cash": {
        title: "Cash Payments",
        description: "Breakdown of all cash payments",
        icon: Banknote,
        transactions: [
          { id: "tx-101", date: "2023-12-31", amount: "OMR 845.20", method: "Cash" },
          { id: "tx-102", date: "2023-12-31", amount: "OMR 567.40", method: "Cash" },
          { id: "tx-103", date: "2023-12-30", amount: "OMR 312.80", method: "Cash" },
          { id: "tx-104", date: "2023-12-30", amount: "OMR 210.25", method: "Cash" },
          { id: "tx-105", date: "2023-12-29", amount: "OMR 410.02", method: "Cash" },
          { id: "tx-106", date: "2023-12-29", amount: "OMR 295.50", method: "Cash" },
          { id: "tx-107", date: "2023-12-28", amount: "OMR 520.75", method: "Cash" },
          { id: "tx-108", date: "2023-12-28", amount: "OMR 185.30", method: "Cash" },
          { id: "tx-109", date: "2023-12-27", amount: "OMR 352.60", method: "Cash" },
          { id: "tx-110", date: "2023-12-27", amount: "OMR 420.15", method: "Cash" },
          { id: "tx-111", date: "2023-12-26", amount: "OMR 278.90", method: "Cash" },
          { id: "tx-112", date: "2023-12-26", amount: "OMR 490.45", method: "Cash" },
          { id: "tx-113", date: "2023-12-25", amount: "OMR 315.80", method: "Cash" },
          { id: "tx-114", date: "2023-12-25", amount: "OMR 215.70", method: "Cash" },
          { id: "tx-115", date: "2023-12-24", amount: "OMR 350.25", method: "Cash" },
        ],
        stats: [
          { label: "Average transaction", value: "OMR 371.40" },
          { label: "Cash counter balance", value: "OMR 1,500.00" },
          { label: "Highest transaction", value: "OMR 845.20" }
        ]
      },
      "Bank Transfer": {
        title: "Bank Transfers",
        description: "Breakdown of all bank transfer payments",
        icon: Building,
        transactions: [
          { id: "tx-301", date: "2023-12-31", amount: "OMR 4,225.80", method: "Bank Muscat" },
          { id: "tx-302", date: "2023-12-30", amount: "OMR 3,150.45", method: "NBO" },
          { id: "tx-303", date: "2023-12-30", amount: "OMR 5,780.20", method: "Bank Dhofar" },
          { id: "tx-304", date: "2023-12-29", amount: "OMR 2,890.75", method: "Bank Muscat" },
          { id: "tx-305", date: "2023-12-29", amount: "OMR 4,125.50", method: "Sohar Int'l" },
          { id: "tx-306", date: "2023-12-28", amount: "OMR 3,540.60", method: "NBO" },
          { id: "tx-307", date: "2023-12-28", amount: "OMR 2,975.35", method: "Bank Muscat" },
          { id: "tx-308", date: "2023-12-27", amount: "OMR 4,650.90", method: "Bank Dhofar" },
          { id: "tx-309", date: "2023-12-27", amount: "OMR 3,825.25", method: "Sohar Int'l" },
          { id: "tx-310", date: "2023-12-26", amount: "OMR 5,120.70", method: "Bank Muscat" },
          { id: "tx-311", date: "2023-12-26", amount: "OMR 2,750.40", method: "NBO" },
          { id: "tx-312", date: "2023-12-25", amount: "OMR 3,930.85", method: "Bank Dhofar" },
          { id: "tx-313", date: "2023-12-25", amount: "OMR 4,275.60", method: "Bank Muscat" },
          { id: "tx-314", date: "2023-12-24", amount: "OMR 3,570.30", method: "Sohar Int'l" },
          { id: "tx-315", date: "2023-12-24", amount: "OMR 5,490.15", method: "NBO" },
        ],
        stats: [
          { label: "Average transaction", value: "OMR 4,020.19" },
          { label: "Most common bank", value: "Bank Muscat (33%)" },
          { label: "Highest transaction", value: "OMR 5,780.20" }
        ]
      },
      "Mobile Transfer": {
        title: "Mobile Transfers",
        description: "Breakdown of all mobile payment transfers",
        icon: Smartphone,
        transactions: [
          { id: "tx-401", date: "2023-12-31", amount: "OMR 780.50", method: "OMR Pay" },
          { id: "tx-402", date: "2023-12-31", amount: "OMR 645.75", method: "Apple Pay" },
          { id: "tx-403", date: "2023-12-30", amount: "OMR 920.30", method: "Google Pay" },
          { id: "tx-404", date: "2023-12-30", amount: "OMR 510.25", method: "OMR Pay" },
          { id: "tx-405", date: "2023-12-29", amount: "OMR 725.90", method: "Samsung Pay" },
          { id: "tx-406", date: "2023-12-29", amount: "OMR 840.60", method: "Apple Pay" },
          { id: "tx-407", date: "2023-12-28", amount: "OMR 590.45", method: "OMR Pay" },
          { id: "tx-408", date: "2023-12-28", amount: "OMR 705.80", method: "Google Pay" },
          { id: "tx-409", date: "2023-12-27", amount: "OMR 625.35", method: "Samsung Pay" },
          { id: "tx-410", date: "2023-12-27", amount: "OMR 875.20", method: "OMR Pay" },
          { id: "tx-411", date: "2023-12-26", amount: "OMR 550.65", method: "Apple Pay" },
          { id: "tx-412", date: "2023-12-26", amount: "OMR 790.40", method: "Google Pay" },
          { id: "tx-413", date: "2023-12-25", amount: "OMR 680.75", method: "OMR Pay" },
          { id: "tx-414", date: "2023-12-25", amount: "OMR 615.90", method: "Samsung Pay" },
          { id: "tx-415", date: "2023-12-24", amount: "OMR 730.15", method: "Apple Pay" },
        ],
        stats: [
          { label: "Average transaction", value: "OMR 705.86" },
          { label: "Most common method", value: "OMR Pay (33%)" },
          { label: "Highest transaction", value: "OMR 920.30" }
        ]
      },
      "Other": {
        title: "Other Payment Methods",
        description: "Breakdown of other payment methods",
        icon: Wallet,
        transactions: [
          { id: "tx-201", date: "2023-12-31", amount: "OMR 45.75", method: "Gift Card" },
          { id: "tx-202", date: "2023-12-30", amount: "OMR 32.50", method: "Store Credit" },
          { id: "tx-203", date: "2023-12-29", amount: "OMR 25.20", method: "Mobile Payment" },
          { id: "tx-204", date: "2023-12-28", amount: "OMR 20.00", method: "Gift Card" },
          { id: "tx-205", date: "2023-12-27", amount: "OMR 37.60", method: "Loyalty Points" },
          { id: "tx-206", date: "2023-12-26", amount: "OMR 42.15", method: "Store Credit" },
          { id: "tx-207", date: "2023-12-25", amount: "OMR 28.90", method: "Gift Card" },
          { id: "tx-208", date: "2023-12-24", amount: "OMR 35.45", method: "Mobile Payment" },
          { id: "tx-209", date: "2023-12-23", amount: "OMR 22.80", method: "Loyalty Points" },
          { id: "tx-210", date: "2023-12-22", amount: "OMR 41.30", method: "Gift Card" },
          { id: "tx-211", date: "2023-12-21", amount: "OMR 18.75", method: "Store Credit" },
          { id: "tx-212", date: "2023-12-20", amount: "OMR 30.60", method: "Mobile Payment" },
          { id: "tx-213", date: "2023-12-19", amount: "OMR 27.40", method: "Gift Card" },
          { id: "tx-214", date: "2023-12-18", amount: "OMR 33.95", method: "Loyalty Points" },
          { id: "tx-215", date: "2023-12-17", amount: "OMR 29.50", method: "Store Credit" },
        ],
        stats: [
          { label: "Average transaction", value: "OMR 31.46" },
          { label: "Most common method", value: "Gift Card (33%)" },
          { label: "Highest transaction", value: "OMR 45.75" }
        ]
      }
    }
  }, [])

  return { paymentDetailsData }
} 