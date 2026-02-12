export interface LinearRegressionModel {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
}

export function linearRegression(
  points: { x: number; y: number }[]
): LinearRegressionModel | null {
  if (!points || points.length < 2) return null;

  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  points.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const predict = (x: number) => intercept + slope * x;

  return { slope, intercept, predict };
}
