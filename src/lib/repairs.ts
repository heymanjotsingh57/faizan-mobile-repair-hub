import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type RepairStatus = Database["public"]["Enums"]["repair_status"];
export type RepairPriority = Database["public"]["Enums"]["repair_priority"];
export type Repair = Database["public"]["Tables"]["repairs"]["Row"];
export type StatusHistory = Database["public"]["Tables"]["repair_status_history"]["Row"];

export const STATUSES: { value: RepairStatus; label: string }[] = [
  { value: "received", label: "Received" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
];

export const statusLabel = (s: RepairStatus) =>
  STATUSES.find((x) => x.value === s)?.label ?? s;

export const statusClasses: Record<RepairStatus, string> = {
  received: "bg-status-received text-status-received-foreground",
  in_progress: "bg-status-progress text-status-progress-foreground",
  ready: "bg-status-ready text-status-ready-foreground",
  delivered: "bg-status-delivered text-status-delivered-foreground",
};

export const WARRANTY_OPTIONS = ["No Warranty", "7 Days", "30 Days", "90 Days", "Custom"];

export const PRIORITIES: { value: RepairPriority; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export type RepairInput = {
  customer_name: string;
  phone_number: string;
  device_brand: string;
  device_model: string;
  imei: string | null;
  problem_description: string;
  quoted_price: number;
  warranty: string | null;
  priority: RepairPriority;
  condition_notes: string | null;
  status: RepairStatus;
};

export async function fetchRepairs(): Promise<Repair[]> {
  const { data, error } = await supabase
    .from("repairs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRepair(id: string): Promise<Repair> {
  const { data, error } = await supabase.from("repairs").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function fetchHistory(repairId: string): Promise<StatusHistory[]> {
  const { data, error } = await supabase
    .from("repair_status_history")
    .select("*")
    .eq("repair_id", repairId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createRepair(input: RepairInput): Promise<Repair> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("repairs")
    .insert({ ...input, job_number: "", created_by: userData.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRepair(id: string, input: Partial<RepairInput>): Promise<Repair> {
  const { data, error } = await supabase.from("repairs").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRepair(id: string): Promise<void> {
  const { error } = await supabase.from("repairs").delete().eq("id", id);
  if (error) throw error;
}
