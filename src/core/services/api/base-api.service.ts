import { storageService } from '../storage.service';

export class BaseApiService<T extends { id: string }> {
  constructor(private storageKey: string) {}

  private getData(): T[] {
    return storageService.get<T[]>(this.storageKey) || [];
  }

  private setData(data: T[]): void {
    storageService.set(this.storageKey, data);
  }

  getAll(): Promise<T[]> {
    return Promise.resolve(this.getData());
  }

  getById(id: string): Promise<T | null> {
    const data = this.getData();
    const item = data.find(item => item.id === id);
    return Promise.resolve(item || null);
  }

  create(item: T): Promise<T> {
    const data = this.getData();
    data.push(item);
    this.setData(data);
    return Promise.resolve(item);
  }

  update(id: string, updates: Partial<T>): Promise<T | null> {
    const data = this.getData();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      return Promise.resolve(null);
    }

    data[index] = { ...data[index], ...updates };
    this.setData(data);
    return Promise.resolve(data[index]);
  }

  delete(id: string): Promise<boolean> {
    const data = this.getData();
    const filteredData = data.filter(item => item.id !== id);
    
    if (data.length === filteredData.length) {
      return Promise.resolve(false);
    }

    this.setData(filteredData);
    return Promise.resolve(true);
  }

  search(predicate: (item: T) => boolean): Promise<T[]> {
    const data = this.getData();
    return Promise.resolve(data.filter(predicate));
  }
}