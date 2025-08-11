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
  contactNumber?: string;
  serviceDescription?: ServiceDescription;
}

export interface CompanyInfo {
  brand: CompanyBrandInfo;
  registered: RegisteredCompanyInfo;
}

const defaultCompanyInfo: CompanyInfo = {
  brand: {
    name: " Service Center",
    addressLines: ["Saham, Sultanate of Oman"],
    phones: ["92510750", "26856848"],
    whatsapp: "72702537",
    posId: "POS-01",
  },
  registered: {
    name: "AL-TARATH NATIONAL CO.",
    arabicName: "شركة الطارث الوطنية",
    crNumber: "1001886",
    addressLines: ["W.Saham", "Al-Sanaiya", "Sultanate of Oman"],
    contactNumber: "71170805",
    serviceDescription: {
      english: "TYRE REPAIRING & OIL CHANGING OF VEHICLES",
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
  return useContext(CompanyInfoContext);
}
