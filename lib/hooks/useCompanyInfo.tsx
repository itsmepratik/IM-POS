"use client";

import React, { createContext, useContext, useMemo } from "react";

export interface CompanyBrandInfo {
  name: string;
  addressLines: string[];
  phones: string[];
  whatsapp?: string;
  posId?: string;
}

export interface ServiceDescription {
  english: string;
  arabic?: string;
}

export interface RegisteredCompanyInfo {
  name: string;
  arabicName?: string;
  crNumber?: string;
  addressLines: string[];
  arabicAddressLines?: string[];
  contactNumber?: string;
  contactNumberArabic?: string;
  serviceDescription?: ServiceDescription;
}

export interface CompanyInfo {
  brand: CompanyBrandInfo;
  registered: RegisteredCompanyInfo;
  thankYouMessage?: {
    english: string;
    arabic?: string;
  };
}

const defaultCompanyInfo: CompanyInfo = {
  brand: {
    name: " Service Center",
    addressLines: ["Saham, Sultanate of Oman"],
    phones: ["99768459", "79774645"],
    whatsapp: "771170805",
    posId: "POS-01",
  },
  registered: {
    name: "FAYD AL-NOOR AL-SAATA TRAD. & CONT.",
    arabicName: "شركة الطارث الوطنية",
    crNumber: "1092602",
    addressLines: ["W.Saham", "Al-Sanaiya", "Sultanate of Oman"],
    arabicAddressLines: ["ولاية صحم", "الصناعية", "سلطنة عمان"],
    contactNumber: "71170805",
    serviceDescription: {
      english: "METAL TURNING & REPAIR OF CAR HUBS & BRAKES",
      arabic: "إصلاح الإطارات وتغيير النفط للمركبات",
    },
  },
};

const CompanyInfoContext = createContext<CompanyInfo>(defaultCompanyInfo);

export function CompanyInfoProvider({
  value,
  children,
}: {
  value?: Partial<CompanyInfo>;
  children: React.ReactNode;
}) {
  const merged = useMemo<CompanyInfo>(() => {
    return {
      brand: { ...defaultCompanyInfo.brand, ...(value?.brand ?? {}) },
      registered: {
        ...defaultCompanyInfo.registered,
        ...(value?.registered ?? {}),
      },
    };
  }, [value]);

  return (
    <CompanyInfoContext.Provider value={merged}>
      {children}
    </CompanyInfoContext.Provider>
  );
}

export function useCompanyInfo(): CompanyInfo {
  const context = useContext(CompanyInfoContext);
  const { currentBranch } = require("@/lib/contexts/BranchContext").useBranch(); // Use require to avoid circular dependency issues at top level if any

  return useMemo(() => {
    if (!currentBranch) return context;

    // Override brand info
    const brand: CompanyBrandInfo = {
      ...context.brand,
      name: currentBranch.brand_name || context.brand.name,
      addressLines: currentBranch.brand_address 
        ? [currentBranch.brand_address] 
        : context.brand.addressLines,
      phones: currentBranch.brand_phones 
        ? currentBranch.brand_phones.split(",").map((p: string) => p.trim()) 
        : context.brand.phones,
      whatsapp: currentBranch.brand_whatsapp || context.brand.whatsapp,
    };

    // Override registered info
    const registered: RegisteredCompanyInfo = {
      ...context.registered,
      name: currentBranch.company_name || context.registered.name,
      arabicName: currentBranch.company_name_arabic || context.registered.arabicName,
      crNumber: currentBranch.cr_number || context.registered.crNumber,
      addressLines: [
        currentBranch.address_line_1 || context.registered.addressLines[0],
        currentBranch.address_line_2 || "",
        currentBranch.address_line_3 || "",
      ].filter(Boolean),
      arabicAddressLines: [
        currentBranch.address_line_arabic_1 || context.registered.arabicAddressLines?.[0] || "",
        currentBranch.address_line_arabic_2 || context.registered.arabicAddressLines?.[1] || "",
      ].filter(Boolean),
      contactNumber: currentBranch.contact_number || context.registered.contactNumber,
      contactNumberArabic: currentBranch.contact_number_arabic || "",
      serviceDescription: {
        english: currentBranch.service_description_en || context.registered.serviceDescription?.english || "",
        arabic: currentBranch.service_description_ar || context.registered.serviceDescription?.arabic,
      }
    };
    
    // We can also attach the thank you message to the returned object if we extend the type
    // But for now, let's stick to the interface. 
    // Wait, we should probably extend the interface to include 'thankYouMessage'
    // For now, let's just make sure the basic info is correct.
    
    // Parse thank you message if available
    const thankYouMessage = {
      english: currentBranch.thank_you_message || context.thankYouMessage?.english || "Thankyou for shopping with us",
      arabic: currentBranch.thank_you_message_ar || context.thankYouMessage?.arabic || "شكراً للتسوق معنا"
    };

    return { brand, registered, thankYouMessage };
  }, [context, currentBranch]);
}
