import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchRepairs, formatPrice, type Repair } from "@/lib/repairs";
import { supabase } from "@/integrations/supabase/client";
import { RepairCard } from "@/components/app/RepairCard";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import {
  CalendarDays,
  Clock,
  PackageCheck,
  Zap,
  TrendingUp,
  ArrowRight,
  Smartphone,
} from "lucide-react";

const repairsQuery = {
  queryKey: ["repairs"],
  queryFn: fetchRepairs,
};

export const Route = createFileRoute("/_authenticated/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(repairsQuery),
  component: Dashboard,
});

function isToday(d: string) {
  const date = new Date(d);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function Dashboard() {
  const { data: repairs } = useSuspenseQuery(repairsQuery);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as { full_name?: string } | undefined;
      setName(meta?.full_name?.split(" ")[0] ?? "there");
    });
  }, []);

  const today = repairs.filter((r) => isToday(r.created_at)).length;
  const pending = repairs.filter((r) => r.status === "received" || r.status === "in_progress").length;
  const ready = repairs.filter((r) => r.status === "ready").length;
  const urgent = repairs.filter((r) => r.priority === "urgent" && r.status !== "delivered").length;
  const expected = repairs
    .filter((r) => r.status !== "delivered")
    .reduce((sum, r) => sum + Number(r.quoted_price), 0);

  const recent = repairs.slice(0, 5);

  return (
    <div className="animate-enter">
      <header className="bg-gradient-to-br from-primary to-primary-glow px-5 pb-8 pt-7 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Smartphone className="h-4 w-4" />
            RepairDesk
          </div>
          <ThemeToggle className="border-white/30 bg-white/15 text-primary-foreground hover:bg-white/25" />
        </div>
        <h1 className="mt-3 text-2xl font-extrabold">Hi {name} 👋</h1>
        <p className="mt-1 text-sm opacity-90">Here's what's happening at the counter today.</p>

        <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-90">
            <TrendingUp className="h-4 w-4" /> Expected earnings (open jobs)
          </div>
          <div className="mt-1 text-3xl font-extrabold">{formatPrice(expected)}</div>
        </div>
      </header>

      <div className="-mt-4 grid grid-cols-2 gap-3 px-4">
        <StatCard icon={CalendarDays} label="Today's Repairs" value={today} tone="received" />
        <StatCard icon={Clock} label="Pending" value={pending} tone="progress" />
        <StatCard icon={PackageCheck} label="Ready for Pickup" value={ready} tone="ready" />
        <StatCard icon={Zap} label="Urgent Jobs" value={urgent} tone="urgent" />
      </div>

      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground">Recent jobs</h2>
          <Link to="/jobs" className="flex items-center gap-1 text-sm font-semibold text-primary">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {recent.map((r) => (
              <RepairCard key={r.id} repair={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const tones: Record<string, string> = {
  received: "bg-status-received text-status-received-foreground",
  progress: "bg-status-progress text-status-progress-foreground",
  ready: "bg-status-ready text-status-ready-foreground",
  urgent: "bg-urgent text-urgent-foreground",
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-3xl font-extrabold text-foreground">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">No repairs yet.</p>
      <Link
        to="/new"
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Create first repair
      </Link>
    </div>
  );
}
