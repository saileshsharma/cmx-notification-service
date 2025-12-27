import { Injectable, signal, computed } from '@angular/core';
import { AuditLogEntry, AuditAction, FeatureFlagUI } from '../../models';
import { environment } from '../config/environment';

/**
 * Audit Log Service
 *
 * Tracks all feature flag operations for compliance and debugging.
 * Features:
 * - In-memory audit trail
 * - Configurable max entries
 * - Export capability
 * - Filter support
 */
@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly _entries = signal<AuditLogEntry[]>([]);
  private entryIdCounter = 0;
  private readonly maxEntries = environment.maxAuditLogEntries;

  readonly entries = this._entries.asReadonly();
  readonly count = computed(() => this._entries().length);

  /**
   * Log a flag toggle action
   */
  logToggle(flag: FeatureFlagUI, previousValue: boolean, newValue: boolean): void {
    this.addEntry({
      flagName: this.formatFlagName(flag.name),
      action: newValue ? 'enabled' : 'disabled',
      previousValue,
      newValue,
      user: 'Admin' // TODO: Get from auth service
    });
  }

  /**
   * Log flag creation
   */
  logCreate(flag: FeatureFlagUI): void {
    this.addEntry({
      flagName: this.formatFlagName(flag.name),
      action: 'created',
      newValue: flag.enabled,
      user: 'Admin'
    });
  }

  /**
   * Log flag update
   */
  logUpdate(flag: FeatureFlagUI): void {
    this.addEntry({
      flagName: this.formatFlagName(flag.name),
      action: 'updated',
      user: 'Admin'
    });
  }

  /**
   * Log flag deletion
   */
  logDelete(flagName: string): void {
    this.addEntry({
      flagName: this.formatFlagName(flagName),
      action: 'deleted',
      user: 'Admin'
    });
  }

  /**
   * Get entries filtered by action type
   */
  getEntriesByAction(action: AuditAction): AuditLogEntry[] {
    return this._entries().filter(e => e.action === action);
  }

  /**
   * Get entries for a specific flag
   */
  getEntriesForFlag(flagName: string): AuditLogEntry[] {
    const formattedName = this.formatFlagName(flagName);
    return this._entries().filter(e => e.flagName === formattedName);
  }

  /**
   * Export audit log as JSON
   */
  exportAsJson(): string {
    return JSON.stringify(this._entries(), null, 2);
  }

  /**
   * Export audit log as CSV
   */
  exportAsCsv(): string {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Flag Name', 'Previous Value', 'New Value'];
    const rows = this._entries().map(e => [
      e.id,
      e.timestamp.toISOString(),
      e.user,
      e.action,
      e.flagName,
      e.previousValue?.toString() ?? '',
      e.newValue?.toString() ?? ''
    ]);

    return [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this._entries.set([]);
  }

  /**
   * Add an entry to the log
   */
  private addEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: ++this.entryIdCounter,
      timestamp: new Date()
    };

    this._entries.update(entries => {
      const updated = [newEntry, ...entries];
      if (updated.length > this.maxEntries) {
        return updated.slice(0, this.maxEntries);
      }
      return updated;
    });
  }

  /**
   * Format flag name for display
   */
  private formatFlagName(name: string): string {
    const parts = name.split('.');
    if (parts.length > 1) {
      return parts.slice(1).join(' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
