import { cn } from "@/lib/utils";
import { statusClasses, statusLabel, type RepairStatus, type RepairPriority } from "@/lib/repairs";
import { Zap } from "lucide-react";

export function StatusBadge({ status, className }: { status: RepairStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        statusClasses[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {statusLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: RepairPriority; className?: string }) {
  if (priority !== "urgent") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-urgent px-2.5 py-1 text-xs font-bold text-urgent-foreground",
        className,
      )}
    >
      <Zap className="h-3 w-3 fill-current" />
      Urgent
    </span>
  );
}
