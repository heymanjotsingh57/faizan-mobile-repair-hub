import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { CurrencyCalculator } from "@/components/app/CurrencyCalculator";
import { LogOut, Mail, Shield, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Counter Staff");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      setEmail(user.email ?? "");
      const meta = user.user_metadata as { full_name?: string } | undefined;
      setName(meta?.full_name ?? "Staff member");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (roles?.some((r) => r.role === "owner")) setRole("Owner");
    })();
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="animate-enter">
      <PageHeader title="Account" subtitle="Your profile & session" />
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-2xl font-extrabold text-primary-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-foreground">{name}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              <Shield className="h-3 w-3" /> {role}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-2 shadow-card">
          <Row icon={User} label="Name" value={name} />
          <Row icon={Mail} label="Email" value={email} />
          <Row icon={Shield} label="Role" value={role} last />
        </div>

        <CurrencyCalculator />

        <Button variant="outline" onClick={signOut} className="h-12 w-full rounded-xl text-base font-semibold">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: typeof User;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-3 ${last ? "" : "border-b border-border"}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
