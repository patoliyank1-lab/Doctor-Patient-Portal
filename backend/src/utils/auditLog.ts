import { prisma } from "../config/database";

export type LogAuditInput = {
  userId?: string;       // User who performed the action (undefined for system actions)
  action: string;        // e.g. "CREATE", "UPDATE", "DELETE", "LOGIN"
  entity: string;        // e.g. "appointment", "user", "medical_record"
  entityId: string;      // The ID of the affected record
  oldValue?: object;     // State before the change (for updates)
  newValue?: object;     // State after the change
  ipAddress?: string;    // From req.ip
  userAgent?: string;    // From req.headers["user-agent"]
};

/**
 * Write a record to the audit_logs table.
 *
 * Fire-and-forget safe — errors are swallowed so an audit failure
 * never breaks the business transaction that triggered it.
 *
 * @example
 * void logAudit({
 *   userId: req.user.userId,
 *   action: "CREATE",
 *   entity: "appointment",
 *   entityId: appointment.id,
 *   newValue: { status: "PENDING" },
 * });
 */
export const logAudit = async (input: LogAuditInput): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        oldValue: input.oldValue ? (input.oldValue as any) : undefined,
        newValue: input.newValue ? (input.newValue as any) : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch {
    // Intentionally swallowed — an audit failure must not break
    // the business transaction that triggered it.
    console.error("[logAudit] failed silently for entity:", input.entity, input.entityId);
  }
};
