import { formatRelativeTime, toLabel } from "@/lib/utils";
import type { AuditLog } from "@/types";

interface AuditLogRowProps {
  log: AuditLog;
}

export function AuditLogRow({ log }: AuditLogRowProps) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border last:border-0">
      {/* Action label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground">
            {log.action}
          </span>
          <span className="text-sm text-foreground font-medium truncate">
            {log.user?.name ?? log.userId}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{toLabel(log.entity)}</span>
          <span>·</span>
          <span className="font-mono">{log.entityId.slice(0, 8)}…</span>
          {log.ipAddress && (
            <>
              <span>·</span>
              <span>{log.ipAddress}</span>
            </>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <time
        dateTime={log.createdAt}
        className="shrink-0 text-xs text-muted-foreground whitespace-nowrap"
        title={new Date(log.createdAt).toLocaleString()}
      >
        {formatRelativeTime(log.createdAt)}
      </time>
    </div>
  );
}
