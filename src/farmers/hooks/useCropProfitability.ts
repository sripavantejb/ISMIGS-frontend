import { useState, useMemo } from "react";
import { FARMER_STATES } from "../data/cropStatsByState";
import { getYieldForStateCrop } from "../data/cropStatsByState";
import { getDefaultYieldPerAcre, getDefaultPricePerTon } from "../data/cropRecommendations";
import { CROP_CHOICES } from "../components/CropSelector";
import type { CultivationCostInputs } from "../types";

export function useCropProfitability(
  stateId: string,
  costInputs: CultivationCostInputs | null,
  areaOverride?: number
) {
  const [selectedCropId, setSelectedCropId] = useState("rice");
  const [pricePerTon, setPricePerTon] = useState(getDefaultPricePerTon("rice"));
  const [dieselPctChange, setDieselPctChange] = useState(0);

  const cropKey = CROP_CHOICES.find((c) => c.id === selectedCropId)?.cropKey as "rice" | "wheat" | undefined;
  const yieldPerAcre =
    cropKey
      ? getYieldForStateCrop(stateId, cropKey) * (1 / 2.47)
      : getDefaultYieldPerAcre(selectedCropId);
  const areaAcres = areaOverride ?? costInputs?.areaAcres ?? 1;

  const projections = useMemo(() => {
    return CROP_CHOICES.filter((c) => c.cropKey).map((c) => {
      const key = c.cropKey as "rice" | "wheat";
      const y = getYieldForStateCrop(stateId, key) * (1 / 2.47);
      const price = getDefaultPricePerTon(c.id);
      const rev = y * areaAcres * price;
      const cost = costInputs
        ? (costInputs.seedCostPerAcre + costInputs.fertilizerCostPerAcre + costInputs.labourCostPerAcre + costInputs.irrigationCostPerAcre + costInputs.otherCostPerAcre) * areaAcres
        : 0;
      return { crop: c.name, netProfit: rev - cost, margin: rev > 0 ? ((rev - cost) / rev) * 100 : 0 };
    });
  }, [stateId, areaAcres, costInputs]);

  const bestCrop = projections.length ? projections.reduce((a, b) => (a.netProfit >= b.netProfit ? a : b)) : null;

  return {
    selectedCropId,
    setSelectedCropId,
    pricePerTon,
    setPricePerTon,
    yieldPerAcre,
    areaAcres,
    costInputs,
    dieselPctChange,
    setDieselPctChange,
    projections,
    bestCrop,
    cropKey,
    defaultPrices: Object.fromEntries(CROP_CHOICES.map((c) => [c.id, getDefaultPricePerTon(c.id)])),
  };
}
