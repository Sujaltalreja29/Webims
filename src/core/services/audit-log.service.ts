import type { AuditAction, AuditLog, User } from '../models';
import { storageService } from './storage.service';

interface RecordAuditEventInput {
  entityType: string;
  entityId: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

class AuditLogService {
  private readonly storageKey = 'audit_logs';
  private readonly maxEntries = 2000;

  private getAllInternal(): AuditLog[] {
    return storageService.get<AuditLog[]>(this.storageKey) || [];
  }

  private setAllInternal(data: AuditLog[]): void {
    storageService.set(this.storageKey, data.slice(0, this.maxEntries));
  }

  private getCurrentUser(): User | null {
    return storageService.get<User>('current_user');
  }

  private toSerializable<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  record(event: RecordAuditEventInput): AuditLog {
    const user = this.getCurrentUser();
    const logs = this.getAllInternal();

    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      timestamp: new Date().toISOString(),
      actorId: user?.id,
      actorName: user?.fullName,
      actorRole: user?.role,
      reason: event.reason,
      before: event.before !== undefined ? this.toSerializable(event.before) : undefined,
      after: event.after !== undefined ? this.toSerializable(event.after) : undefined
    };

    logs.unshift(entry);
    this.setAllInternal(logs);
    return entry;
  }

  getAll(): AuditLog[] {
    return this.getAllInternal().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const auditLogService = new AuditLogService();
