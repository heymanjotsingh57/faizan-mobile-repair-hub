import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ClipboardList, Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const left = [
  { to: "/", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/jobs", label: "Jobs", icon: ClipboardList, exact: false },
] as const;

const right = [
  { to: "/search", label: "Search", icon: Search, exact: false },
  { to: "/account", label: "Account", icon: User, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-end justify-between px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex flex-1 justify-around">
          {left.map((i) => (
            <NavItem key={i.to} {...i} />
          ))}
        </div>

        <Link
          to="/new"
          className="-mt-8 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-elevated transition-transform active:scale-95"
          aria-label="New repair"
        >
          <Plus className="h-7 w-7" />
        </Link>

        <div className="flex flex-1 justify-around">
          {right.map((i) => (
            <NavItem key={i.to} {...i} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  exact,
}: {
  to: string;
  label: string;
  icon: typeof Search;
  exact: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="flex w-16 flex-col items-center gap-1 py-1 text-muted-foreground transition-colors data-[status=active]:text-primary"
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-9 w-12 items-center justify-center rounded-xl transition-colors",
              isActive && "bg-accent",
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-semibold">{label}</span>
        </>
      )}
    </Link>
  );
}
