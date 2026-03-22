import type { UserRole } from './user.model';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  timestamp: string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  reason?: string;
  before?: unknown;
  after?: unknown;
}
