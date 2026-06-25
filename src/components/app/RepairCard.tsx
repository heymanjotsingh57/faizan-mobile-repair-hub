import { Link } from "@tanstack/react-router";
import { ChevronRight, Phone, Smartphone } from "lucide-react";
import { formatPrice, type Repair } from "@/lib/repairs";
import { StatusBadge, PriorityBadge } from "./Badges";

export function RepairCard({ repair }: { repair: Repair }) {
  return (
    <Link
      to="/repair/$id"
      params={{ id: repair.id }}
      className="group block rounded-2xl border border-border bg-card p-4 shadow-card transition-all active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold text-foreground">{repair.customer_name}</span>
            <PriorityBadge priority={repair.priority} />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">{repair.phone_number}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Smartphone className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {repair.device_brand} {repair.device_model}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={repair.status} />
          <span className="text-sm font-extrabold text-foreground">{formatPrice(Number(repair.quoted_price))}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-xs font-semibold text-primary">{repair.job_number}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {new Date(repair.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
