import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRepair, type RepairInput } from "@/lib/repairs";
import { PageHeader } from "@/components/app/PageHeader";
import { RepairForm } from "@/components/app/RepairForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/new")({
  component: NewRepairPage,
});

function NewRepairPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: RepairInput) => createRepair(data),
    onSuccess: (repair) => {
      qc.invalidateQueries({ queryKey: ["repairs"] });
      toast.success(`Repair ${repair.job_number} created`);
      navigate({ to: "/repair/$id", params: { id: repair.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create repair"),
  });

  return (
    <div className="animate-enter">
      <PageHeader title="New Repair" subtitle="Register a repair job" back />
      <RepairForm submitLabel="Create repair job" loading={mutation.isPending} onSubmit={(d) => mutation.mutate(d)} />
    </div>
  );
}
