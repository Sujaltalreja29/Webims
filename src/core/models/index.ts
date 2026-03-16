export * from './user.model';
export * from './patient.model';
export * from './appointment.model';
export * from './encounter.model';
export * from './prescription.model';
export * from './claim.model';
export * from './lab-result.model';
// Add these exports
export * from './medication-inventory.model';
export type { MedicationInventory, StockTransaction, RefillRequest } from './medication-inventory.model';