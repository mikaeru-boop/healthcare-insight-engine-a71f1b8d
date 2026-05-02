import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  ArrowLeftRight,
  Calendar,
  PieChart,
  TrendingUp,
  Search,
  Settings,
  HelpCircle,
  Bell,
  User,
  RotateCcw,
} from "lucide-react";

const primary = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Recommendations", url: "/recommendations", icon: Sparkles },
  { title: "Transactions", url: "#", icon: ArrowLeftRight },
  { title: "Schedule", url: "#", icon: Calendar },
  { title: "Insights", url: "#", icon: Search },
  { title: "Reports", url: "#", icon: PieChart },
  { title: "Trends", url: "#", icon: TrendingUp },
];

const utility = [
  { title: "Refresh", icon: RotateCcw },
  { title: "Settings", icon: Settings },
  { title: "Help", icon: HelpCircle },
  { title: "Alerts", icon: Bell },
  { title: "Profile", icon: User },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center justify-between border-r border-border bg-card py-4">
      {/* Logo */}
      <div className="flex flex-col items-center gap-1">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        {primary.map((item) => {
          const active = item.url !== "#" && currentPath === item.url;
          const Icon = item.icon;
          const Btn = (
            <span
              className={`group flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={item.title}
              aria-label={item.title}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
          );
          return item.url === "#" ? (
            <button key={item.title} type="button">
              {Btn}
            </button>
          ) : (
            <Link key={item.title} to={item.url}>
              {Btn}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1">
        {utility.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              title={item.title}
              aria-label={item.title}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}
