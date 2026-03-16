import { BaseApiService } from './base-api.service';
import type { MedicationInventory, StockTransaction } from '../../models';

class MedicationInventoryApiService extends BaseApiService<MedicationInventory> {
  constructor() {
    super('medication_inventory');
  }

  // Search medications by name
  async searchByName(query: string): Promise<MedicationInventory[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(med => 
      med.medicationName.toLowerCase().includes(lowerQuery) ||
      med.genericName?.toLowerCase().includes(lowerQuery)
    );
  }

  // Get low stock medications
  async getLowStock(): Promise<MedicationInventory[]> {
    const all = await this.getAll();
    return all.filter(med => med.stockQuantity <= med.reorderLevel);
  }

  // Get expiring soon (within 30 days)
  async getExpiringSoon(): Promise<MedicationInventory[]> {
    const all = await this.getAll();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return all.filter(med => {
      const expiryDate = new Date(med.expiryDate);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    });
  }

  // Get out of stock
  async getOutOfStock(): Promise<MedicationInventory[]> {
    const all = await this.getAll();
    return all.filter(med => med.stockQuantity === 0);
  }

  // Get controlled substances
  async getControlledSubstances(): Promise<MedicationInventory[]> {
    const all = await this.getAll();
    return all.filter(med => med.isControlled);
  }

  // Find by medication name (exact match)
  async findByName(medicationName: string): Promise<MedicationInventory | null> {
    const all = await this.getAll();
    return all.find(med => 
      med.medicationName.toLowerCase() === medicationName.toLowerCase()
    ) || null;
  }

  // Update stock quantity
  async updateStock(id: string, newQuantity: number): Promise<MedicationInventory> {
    const medication = await this.getById(id);
    if (!medication) {
      throw new Error('Medication not found');
    }

    const updated = {
      ...medication,
      stockQuantity: newQuantity,
      updatedAt: new Date().toISOString()
    };

    const result = await this.update(id, updated);
    if (!result) {
      throw new Error('Failed to update medication');
    }

    return result;
  }
}

class StockTransactionApiService extends BaseApiService<StockTransaction> {
  constructor() {
    super('stock_transactions');
  }

  // Get transactions for a medication
  async getByMedication(medicationId: string): Promise<StockTransaction[]> {
    const all = await this.getAll();
    return all
      .filter(tx => tx.medicationId === medicationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get recent transactions
  async getRecent(limit: number = 10): Promise<StockTransaction[]> {
    const all = await this.getAll();
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Create transaction and update inventory
  async createTransaction(
    transaction: Omit<StockTransaction, 'id' | 'createdAt'>
  ): Promise<StockTransaction> {
    const newTransaction: StockTransaction = {
      ...transaction,
      id: `stock-tx-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    await this.create(newTransaction);
    return newTransaction;
  }
}

export const medicationInventoryApi = new MedicationInventoryApiService();
export const stockTransactionApi = new StockTransactionApiService();