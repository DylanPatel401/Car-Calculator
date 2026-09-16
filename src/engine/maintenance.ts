import { Vehicle } from '@/types/domain';

export function estimateMonthlyMaintenance(vehicle: Vehicle, currentYear = new Date().getFullYear()): number {
  const age = Math.max(0, currentYear - vehicle.year);
  const base = vehicle.condition === 'new' ? 35 : 65;
  const ageFactor = age * 5;
  const mileageFactor = Math.max(0, vehicle.mileage) / 10000 * 4;
  return Math.min(350, base + ageFactor + mileageFactor);
}

export function maintenanceCost(vehicle: Vehicle): { amount: number; isEstimate: boolean } {
  return vehicle.maintenanceMonthly === null || !Number.isFinite(vehicle.maintenanceMonthly)
    ? { amount: estimateMonthlyMaintenance(vehicle), isEstimate: true }
    : { amount: Math.max(0, vehicle.maintenanceMonthly), isEstimate: false };
}
