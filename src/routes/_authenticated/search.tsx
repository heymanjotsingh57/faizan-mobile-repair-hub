import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchRepairs, formatPrice } from "@/lib/repairs";
import { PageHeader } from "@/components/app/PageHeader";
import { RepairCard } from "@/components/app/RepairCard";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, History } from "lucide-react";

const repairsQuery = { queryKey: ["repairs"], queryFn: fetchRepairs };

export const Route = createFileRoute("/_authenticated/search")({
  loader: ({ context }) => context.queryClient.ensureQueryData(repairsQuery),
  component: SearchPage,
});

function SearchPage() {
  const { data: repairs } = useSuspenseQuery(repairsQuery);
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!term) return [];
    return repairs.filter(
      (r) =>
        r.job_number.toLowerCase().includes(term) ||
        r.phone_number.toLowerCase().includes(term) ||
        r.customer_name.toLowerCase().includes(term),
    );
  }, [term, repairs]);

  // Customer history: if the term looks like it matches a single phone number, group it.
  const phoneMatch = useMemo(() => {
    if (!term) return null;
    const byPhone = results.filter((r) => r.phone_number.toLowerCase().includes(term));
    const phones = new Set(byPhone.map((r) => r.phone_number));
    if (byPhone.length > 1 && phones.size === 1) {
      const list = [...byPhone].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      return {
        phone: byPhone[0].phone_number,
        name: byPhone[0].customer_name,
        count: list.length,
        spent: list.reduce((s, r) => s + Number(r.quoted_price), 0),
        list,
      };
    }
    return null;
  }, [results, term]);

  return (
    <div className="animate-enter">
      <PageHeader title="Search" subtitle="Find jobs in seconds" />
      <div className="sticky top-[57px] z-20 bg-background/90 px-4 py-3 backdrop-blur-lg">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Job ID, phone, or customer name"
            className="h-14 rounded-2xl pl-12 text-base shadow-card"
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        {!term && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <SearchIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Search by job ID, phone number, or customer name.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Searching a phone number shows the full customer history.
            </p>
          </div>
        )}

        {term && phoneMatch && (
          <div className="mb-4 rounded-2xl border border-primary/30 bg-accent/60 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-accent-foreground">
              <History className="h-4 w-4" /> Customer history
            </div>
            <p className="mt-1 text-base font-extrabold text-foreground">{phoneMatch.name}</p>
            <p className="text-xs text-muted-foreground">{phoneMatch.phone}</p>
            <div className="mt-2 flex gap-4 text-xs font-semibold text-foreground">
              <span>{phoneMatch.count} repairs</span>
              <span>{formatPrice(phoneMatch.spent)} quoted</span>
            </div>
          </div>
        )}

        {term && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
        )}

        <div className="space-y-3">
          {(phoneMatch ? phoneMatch.list : results).map((r) => (
            <RepairCard key={r.id} repair={r} />
          ))}
          {term && results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No matching repairs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
