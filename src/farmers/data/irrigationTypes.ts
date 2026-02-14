export const IRRIGATION_TYPES = [
  { id: "diesel", label: "Diesel pump" },
  { id: "electric", label: "Electric pump" },
  { id: "solar", label: "Solar pump" },
] as const;

export type IrrigationTypeId = (typeof IRRIGATION_TYPES)[number]["id"];
