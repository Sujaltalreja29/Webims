import { Prescription } from '../../models';
import { BaseApiService } from './base-api.service';

class PrescriptionApiService extends BaseApiService<Prescription> {
  constructor() {
    super('prescriptions');
  }

  generateRxNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `RX${timestamp}`;
  }

  // Get prescriptions by patient
  getByPatient(patientId: string): Promise<Prescription[]> {
    return this.search(p => p.patientId === patientId);
  }

  // Get prescriptions by provider
  getByProvider(providerId: string): Promise<Prescription[]> {
    return this.search(p => p.providerId === providerId);
  }

  // Get prescriptions by encounter
  getByEncounter(encounterId: string): Promise<Prescription[]> {
    return this.search(p => p.encounterId === encounterId);
  }

  // Get prescriptions by status
  getByStatus(status: Prescription['status']): Promise<Prescription[]> {
    return this.search(p => p.status === status);
  }

  // Get pharmacy queue (all prescriptions sent to pharmacy)
  async getPharmacyQueue(): Promise<Prescription[]> {
    const all = await this.getAll();
    return all.filter(p => 
      p.status !== 'Cancelled' // Show all except cancelled
    ).sort((a, b) => {
      // Sort by status priority: Pending first, then Ready, then Dispensed
      const statusOrder: Record<Prescription['status'], number> = {
        'Pending': 1,
        'Sent to Pharmacy': 1,
        'Ready': 2,
        'Dispensed': 3,
        'Cancelled': 4
      };
      
      const priorityDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Within same status, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  // Get prescriptions that need attention (Pending or Sent to Pharmacy)
  async getPendingQueue(): Promise<Prescription[]> {
    const all = await this.getAll();
    return all.filter(p => 
      p.status === 'Pending' || p.status === 'Sent to Pharmacy'
    );
  }

  // Get prescriptions ready for pickup
  async getReadyQueue(): Promise<Prescription[]> {
    return this.getByStatus('Ready');
  }

  // Get dispensed prescriptions from today
  async getDispensedToday(): Promise<Prescription[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    
    return all.filter(p => {
      if (p.status !== 'Dispensed' || !p.dispensedAt) return false;
      const dispensedDate = p.dispensedAt.split('T')[0];
      return dispensedDate === today;
    });
  }

  // Mark prescription as ready for pickup
  async markAsReady(id: string, userId: string, userName: string): Promise<Prescription | null> {
    const prescription = await this.getById(id);
    if (!prescription) return null;

    return this.update(id, {
      status: 'Ready',
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    } as Partial<Prescription>);
  }

  // Dispense prescription to patient
  async dispense(
    id: string, 
    userId: string, 
    userName: string,
    notes?: string
  ): Promise<Prescription | null> {
    const prescription = await this.getById(id);
    if (!prescription) return null;

    return this.update(id, {
      status: 'Dispensed',
      dispensedAt: new Date().toISOString(),
      dispensedBy: userName,
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    } as Partial<Prescription>);
  }

  // Cancel prescription
  async cancel(
    id: string, 
    reason: string, 
    userId: string
  ): Promise<Prescription | null> {
    const prescription = await this.getById(id);
    if (!prescription) return null;

    return this.update(id, {
      status: 'Cancelled',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      cancelledBy: userId,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    } as Partial<Prescription>);
  }

  // Get active prescriptions for a patient (dispensed with refills remaining)
  async getActivePrescriptions(patientId: string): Promise<Prescription[]> {
    const all = await this.getByPatient(patientId);
    return all.filter(p => 
      p.status === 'Dispensed' && 
      p.refills > 0 &&
      p.dispensedAt // Must have been dispensed at least once
    );
  }

  // Get prescription statistics
  async getStats(): Promise<{
    total: number;
    pending: number;
    ready: number;
    dispensedToday: number;
    cancelled: number;
  }> {
    const [all, dispensedToday] = await Promise.all([
      this.getAll(),
      this.getDispensedToday()
    ]);

    return {
      total: all.length,
      pending: all.filter(p => p.status === 'Pending' || p.status === 'Sent to Pharmacy').length,
      ready: all.filter(p => p.status === 'Ready').length,
      dispensedToday: dispensedToday.length,
      cancelled: all.filter(p => p.status === 'Cancelled').length
    };
  }

  // Simulate revenue calculation (in real app, this would come from pricing data)
  async getTotalRevenue(): Promise<number> {
    const dispensed = await this.search(p => p.status === 'Dispensed');
    
    // Simulate pricing: \$10-\$200 per prescription based on quantity
    return dispensed.reduce((total, p) => {
      const basePrice = 10;
      const quantityMultiplier = Math.min(p.quantity / 10, 20); // Cap at \$200
      return total + (basePrice * quantityMultiplier);
    }, 0);
  }

  // Search prescriptions (by patient name, medication, or rx number)
  async searchPrescriptions(searchTerm: string): Promise<Prescription[]> {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return this.getPharmacyQueue();

    const all = await this.getPharmacyQueue();
    
    // Note: In real implementation, we'd join with patient data
    // For now, we filter by rx number and medication name
    return all.filter(p => 
      p.rxNumber.toLowerCase().includes(term) ||
      p.medicationName.toLowerCase().includes(term)
      // TODO: Add patient name search when we join patient data in the component
    );
  }
}

export const prescriptionApi = new PrescriptionApiService();