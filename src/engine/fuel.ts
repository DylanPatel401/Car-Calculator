export function calculateMonthlyFuelCost(annualMiles: number, mpg: number, fuelPrice: number): number | null {
  if (!Number.isFinite(mpg) || mpg <= 0 || !Number.isFinite(annualMiles) || annualMiles < 0 || !Number.isFinite(fuelPrice) || fuelPrice < 0) {
    return null;
  }
  return (annualMiles / mpg) * fuelPrice / 12;
}
