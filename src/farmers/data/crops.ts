/**
 * Central crop data source for all agriculture dropdowns.
 */

export interface CropOption {
  id: string;
  name: string;
  cropKey?: "rice" | "wheat"; // Only rice/wheat have state-specific yields in cropStatsByState
}

export const CROP_OPTIONS: CropOption[] = [
  { id: "rice", name: "Rice", cropKey: "rice" },
  { id: "wheat", name: "Wheat", cropKey: "wheat" },
  { id: "cotton", name: "Cotton" },
  { id: "sugarcane", name: "Sugarcane" },
  { id: "maize", name: "Maize" },
  { id: "bajra", name: "Bajra (Pearl millet)" },
  { id: "jowar", name: "Jowar (Sorghum)" },
  { id: "ragi", name: "Ragi (Finger millet)" },
  { id: "chickpea", name: "Chickpea (Gram)" },
  { id: "soybean", name: "Soybean" },
  { id: "groundnut", name: "Groundnut" },
  { id: "mustard", name: "Mustard" },
  { id: "pigeon-pea", name: "Pigeon pea (Arhar/Tur)" },
  { id: "potato", name: "Potato" },
  { id: "onion", name: "Onion" },
  { id: "tomato", name: "Tomato" },
];

export const CROP_IDS: string[] = CROP_OPTIONS.map((c) => c.id);
