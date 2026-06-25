import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchRepair,
  fetchHistory,
  updateRepair,
  deleteRepair,
  formatPrice,
  statusLabel,
  STATUSES,
  type RepairInput,
  type RepairStatus,
} from "@/lib/repairs";
import { PageHeader } from "@/components/app/PageHeader";
import { RepairForm } from "@/components/app/RepairForm";
import { StatusBadge, PriorityBadge } from "@/components/app/Badges";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Phone,
  Smartphone,
  Hash,
  FileText,
  ShieldCheck,
  StickyNote,
  Pencil,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/repair/$id")({
  component: RepairDetail,
});

function RepairDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: repair, isLoading } = useQuery({ queryKey: ["repair", id], queryFn: () => fetchRepair(id) });
  const { data: history } = useQuery({ queryKey: ["history", id], queryFn: () => fetchHistory(id) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["repair", id] });
    qc.invalidateQueries({ queryKey: ["history", id] });
    qc.invalidateQueries({ queryKey: ["repairs"] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: RepairStatus) => updateRepair(id, { status }),
    onSuccess: () => {
      invalidate();
      toast.success("Status updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const editMutation = useMutation({
    mutationFn: (data: RepairInput) => updateRepair(id, data),
    onSuccess: () => {
      invalidate();
      setEditing(false);
      toast.success("Repair updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRepair(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      toast.success("Repair deleted");
      navigate({ to: "/jobs" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  if (isLoading || !repair) {
    return (
      <div className="animate-enter">
        <PageHeader title="Repair" back />
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="animate-enter">
        <PageHeader title={`Edit ${repair.job_number}`} back />
        <RepairForm
          initial={repair}
          submitLabel="Save changes"
          showStatus
          loading={editMutation.isPending}
          onSubmit={(d) => editMutation.mutate(d)}
        />
      </div>
    );
  }

  return (
    <div className="animate-enter">
      <PageHeader
        title={repair.job_number}
        subtitle={repair.customer_name}
        back
        action={
          <button
            onClick={() => setEditing(true)}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground active:bg-accent"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        }
      />

      <div className="space-y-4 px-4 py-4">
        {/* Hero */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-extrabold text-foreground">{repair.customer_name}</h2>
                <PriorityBadge priority={repair.priority} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {repair.device_brand} {repair.device_model}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-foreground">{formatPrice(Number(repair.quoted_price))}</p>
              <p className="text-xs text-muted-foreground">quoted</p>
            </div>
          </div>
          <div className="mt-4">
            <StatusBadge status={repair.status} />
          </div>
        </div>

        {/* Status update */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Update status</h3>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => {
              const active = repair.status === s.value;
              return (
                <button
                  key={s.value}
                  disabled={active || statusMutation.isPending}
                  onClick={() => statusMutation.mutate(s.value)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-100 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-background text-foreground active:bg-accent"
                  }`}
                >
                  {active && <Check className="h-4 w-4" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl border border-border bg-card p-2 shadow-card">
          <DetailRow icon={Phone} label="Phone" value={repair.phone_number} />
          <DetailRow icon={Smartphone} label="Device" value={`${repair.device_brand} ${repair.device_model}`} />
          {repair.imei && <DetailRow icon={Hash} label="IMEI / Serial" value={repair.imei} />}
          <DetailRow icon={FileText} label="Problem" value={repair.problem_description} />
          <DetailRow icon={ShieldCheck} label="Warranty" value={repair.warranty || "—"} />
          {repair.condition_notes && (
            <DetailRow icon={StickyNote} label="Condition notes" value={repair.condition_notes} last />
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Status timeline</h3>
          <ol className="relative ml-2 space-y-5 border-l-2 border-border pl-5">
            {(history ?? []).map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[26px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-card">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <p className="text-sm font-bold text-foreground">{statusLabel(h.status)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
            {(!history || history.length === 0) && (
              <li className="text-sm text-muted-foreground">No history yet.</li>
            )}
          </ol>
        </div>

        <p className="px-1 text-xs text-muted-foreground">
          Created {new Date(repair.created_at).toLocaleString()} · Updated{" "}
          {new Date(repair.updated_at).toLocaleString()}
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="h-12 w-full rounded-xl text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete repair
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this repair?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes {repair.job_number} and its history. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`flex gap-3 px-3 py-3 ${last ? "" : "border-b border-border"}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="whitespace-pre-wrap break-words text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
