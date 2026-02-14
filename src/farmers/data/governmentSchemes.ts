/**
 * Static list of government schemes (Central/State) for farmers.
 */

export interface GovernmentScheme {
  id: string;
  name: string;
  level: "Central" | "State";
  state?: string;
  eligibility: string;
  documents: string;
  benefitAmount: string;
  applicationLink: string;
}

export const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: "pm-kisan",
    name: "PM-KISAN",
    level: "Central",
    eligibility: "Landholding farmer families; small and marginal",
    documents: "Aadhaar, land records, bank account",
    benefitAmount: "₹6,000 per year in 3 instalments",
    applicationLink: "https://pmkisan.gov.in/",
  },
  {
    id: "kcc",
    name: "Kisan Credit Card (KCC)",
    level: "Central",
    eligibility: "Farmers, tenant farmers, SHGs",
    documents: "Land record, ID, bank account",
    benefitAmount: "Credit limit for crop and allied activities at subsidised interest",
    applicationLink: "https://www.nabard.org/",
  },
  {
    id: "fasal-bima",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    level: "Central",
    eligibility: "Farmers growing notified crops",
    documents: "Land record, Aadhaar, bank account",
    benefitAmount: "Crop insurance; premium subsidy by Govt",
    applicationLink: "https://pmfby.gov.in/",
  },
  {
    id: "npk-ss",
    name: "Soil Health Card Scheme",
    level: "Central",
    eligibility: "All farmers",
    documents: "Land details",
    benefitAmount: "Free soil testing and recommendation",
    applicationLink: "https://soilhealth.dac.gov.in/",
  },
  {
    id: "rkvy",
    name: "Rashtriya Krishi Vikas Yojana (RKVY)",
    level: "Central",
    eligibility: "States for sectoral planning; farmers through state programmes",
    documents: "As per state guidelines",
    benefitAmount: "Assistance for infrastructure and sub-schemes",
    applicationLink: "https://rkvy.nic.in/",
  },
  {
    id: "telangana-rytu",
    name: "Rythu Bandhu",
    level: "State",
    state: "Telangana",
    eligibility: "Landowning farmers",
    documents: "Land record (pattadar passbook)",
    benefitAmount: "₹5,000/acre per season (kharif & rabi)",
    applicationLink: "https://rythubandhu.telangana.gov.in/",
  },
  {
    id: "odisha-kalia",
    name: "KALIA (Krushak Assistance for Livelihood and Income Augmentation)",
    level: "State",
    state: "Odisha",
    eligibility: "Small/marginal farmers, landless agricultural labourers",
    documents: "Land record / labour card, Aadhaar, bank account",
    benefitAmount: "Financial assistance for cultivation and livelihood",
    applicationLink: "https://kalia.odisha.gov.in/",
  },
  {
    id: "ap-rytu-bharosa",
    name: "YSR Rythu Bharosa",
    level: "State",
    state: "Andhra Pradesh",
    eligibility: "Landholding farmers, tenant farmers",
    documents: "Land record, Aadhaar, bank account",
    benefitAmount: "₹13,500 per year (₹7,500 + input subsidy)",
    applicationLink: "https://ysrrythubharosa.ap.gov.in/",
  },
  {
    id: "up-kisan-samman",
    name: "Mukhyamantri Kisan Samman Nidhi",
    level: "State",
    state: "Uttar Pradesh",
    eligibility: "Small and marginal farmers",
    documents: "Land record, Aadhaar, bank account",
    benefitAmount: "₹2,000 per quarter",
    applicationLink: "https://upagriculture.com/",
  },
];
