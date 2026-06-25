import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchRepairs, STATUSES, type RepairStatus } from "@/lib/repairs";
import { PageHeader } from "@/components/app/PageHeader";
import { RepairCard } from "@/components/app/RepairCard";

const repairsQuery = { queryKey: ["repairs"], queryFn: fetchRepairs };

export const Route = createFileRoute("/_authenticated/jobs")({
  loader: ({ context }) => context.queryClient.ensureQueryData(repairsQuery),
  component: JobsPage,
});

type Filter = "all" | RepairStatus;

function JobsPage() {
  const { data: repairs } = useSuspenseQuery(repairsQuery);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? repairs : repairs.filter((r) => r.status === filter);

  const tabs: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    ...STATUSES.map((s) => ({ value: s.value as Filter, label: s.label })),
  ];

  return (
    <div className="animate-enter">
      <PageHeader title="All Jobs" subtitle={`${repairs.length} total repairs`} />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === t.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-3 px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No jobs in this category.
          </div>
        ) : (
          filtered.map((r) => <RepairCard key={r.id} repair={r} />)
        )}
      </div>
    </div>
  );
}
