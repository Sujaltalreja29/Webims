export interface MedicationInventory {
  id: string;
  medicationName: string;
  genericName?: string;
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Cream' | 'Drops' | 'Inhaler' | 'Patch';
  strength: string;
  manufacturer: string;
  ndc: string; // National Drug Code
  stockQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitPrice: number;
  expiryDate: string;
  lotNumber: string;
  location: string;
  isControlled: boolean;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  medicationId: string;
  transactionType: 'Received' | 'Dispensed' | 'Adjustment' | 'Expired' | 'Returned';
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  prescriptionId?: string;
  reason?: string;
  performedBy: string;
  performedByName: string;
  notes?: string;
  createdAt: string;
}

export interface RefillRequest {
  id: string;
  refillRequestNumber: string;
  originalPrescriptionId: string;
  patientId: string;
  medicationName: string;
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Denied' | 'Dispensed';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedDate?: string;
  denialReason?: string;
  newPrescriptionId?: string; // Created when approved
  notes?: string;
  createdAt: string;
}