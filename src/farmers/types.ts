/**
 * Shared types for the farmers module.
 */

export interface FarmProfile {
  id?: string;
  userId?: string;
  state: string;
  district: string;
  landSizeAcres: number;
  soilType: string;
  irrigationType: "diesel" | "electric" | "solar";
  cropHistory: Array<{ crop: string; year: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CropChoice {
  id: string;
  name: string;
  cropKey?: string; // e.g. rice, wheat for yield lookup
}

export interface CultivationCostInputs {
  areaAcres: number;
  seedCostPerAcre: number;
  fertilizerCostPerAcre: number;
  labourCostPerAcre: number;
  irrigationCostPerAcre: number;
  otherCostPerAcre: number;
}

export interface PricePoint {
  type: "fertilizer" | "diesel" | "electricity";
  value: number;
  unit: string;
  trend?: "up" | "down" | "stable";
  updatedAt?: string;
}

export interface AlertPreference {
  id: string;
  label: string;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export type EnergyRiskLevel = "low" | "medium" | "high";
