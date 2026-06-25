import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        {back ? (
          <button
            onClick={() => router.history.back()}
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors active:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-10 w-0" />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </header>
  );
}
