import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  PRIORITIES,
  STATUSES,
  WARRANTY_OPTIONS,
  type RepairInput,
  type RepairPriority,
  type RepairStatus,
} from "@/lib/repairs";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
    <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const Field = ({
  label,
  htmlFor,
  children,
  optional,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={htmlFor}>
      {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
    </Label>
    {children}
  </div>
);

export function RepairForm({
  initial,
  submitLabel,
  showStatus,
  onSubmit,
  loading,
}: {
  initial?: Partial<RepairInput>;
  submitLabel: string;
  showStatus?: boolean;
  loading?: boolean;
  onSubmit: (data: RepairInput) => void;
}) {
  const [form, setForm] = useState<RepairInput>({
    customer_name: initial?.customer_name ?? "",
    phone_number: initial?.phone_number ?? "",
    device_brand: initial?.device_brand ?? "",
    device_model: initial?.device_model ?? "",
    imei: initial?.imei ?? "",
    problem_description: initial?.problem_description ?? "",
    quoted_price: initial?.quoted_price ?? 0,
    warranty: initial?.warranty ?? "No Warranty",
    priority: initial?.priority ?? "normal",
    condition_notes: initial?.condition_notes ?? "",
    status: initial?.status ?? "received",
  });

  const set = <K extends keyof RepairInput>(key: K, value: RepairInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      imei: form.imei?.trim() || null,
      warranty: form.warranty?.trim() || null,
      condition_notes: form.condition_notes?.trim() || null,
    });
  }

  const inputCls = "h-12 rounded-xl";

  return (
    <form onSubmit={submit} className="space-y-4 px-4 py-4">
      <Section title="Customer">
        <Field label="Customer name" htmlFor="customer_name">
          <Input
            id="customer_name"
            value={form.customer_name}
            onChange={(e) => set("customer_name", e.target.value)}
            placeholder="John Smith"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Phone number" htmlFor="phone_number">
          <Input
            id="phone_number"
            type="tel"
            value={form.phone_number}
            onChange={(e) => set("phone_number", e.target.value)}
            placeholder="+1 555 123 4567"
            required
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Device">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand" htmlFor="device_brand">
            <Input
              id="device_brand"
              value={form.device_brand}
              onChange={(e) => set("device_brand", e.target.value)}
              placeholder="Apple"
              required
              className={inputCls}
            />
          </Field>
          <Field label="Model" htmlFor="device_model">
            <Input
              id="device_model"
              value={form.device_model}
              onChange={(e) => set("device_model", e.target.value)}
              placeholder="iPhone 13"
              required
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="IMEI / Serial" htmlFor="imei" optional>
          <Input
            id="imei"
            value={form.imei ?? ""}
            onChange={(e) => set("imei", e.target.value)}
            placeholder="356789..."
            className={inputCls}
          />
        </Field>
      </Section>

      <Section title="Repair">
        <Field label="Problem description" htmlFor="problem">
          <Textarea
            id="problem"
            value={form.problem_description}
            onChange={(e) => set("problem_description", e.target.value)}
            placeholder="Screen not responding to touch..."
            required
            rows={3}
            className="rounded-xl"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quoted price" htmlFor="price">
            <Input
              id="price"
              type="number"
              min={0}
              step="1"
              value={form.quoted_price}
              onChange={(e) => set("quoted_price", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onValueChange={(v) => set("priority", v as RepairPriority)}>
              <SelectTrigger className="!h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Warranty">
            <Select value={form.warranty ?? ""} onValueChange={(v) => set("warranty", v)}>
              <SelectTrigger className="!h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WARRANTY_OPTIONS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {showStatus && (
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v as RepairStatus)}>
                <SelectTrigger className="!h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </Section>

      <Section title="Device condition notes">
        <Field label="Notes" htmlFor="condition" optional>
          <Textarea
            id="condition"
            value={form.condition_notes ?? ""}
            onChange={(e) => set("condition_notes", e.target.value)}
            placeholder="Front glass cracked, back cover scratched, no SIM, no charger, customer left phone cover..."
            rows={4}
            className="rounded-xl"
          />
        </Field>
      </Section>

      <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl text-base font-bold shadow-card">
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
