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

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const primary = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Recommendations", url: "/recommendations", icon: Sparkles },
  { title: "Transactions", url: "/", icon: ArrowLeftRight },
  { title: "Schedule", url: "/", icon: Calendar },
  { title: "Insights", url: "/", icon: Search },
  { title: "Reports", url: "/", icon: PieChart },
  { title: "Trends", url: "/", icon: TrendingUp },
];

const utility = [
  { title: "Refresh", url: "/", icon: RotateCcw },
  { title: "Settings", url: "/", icon: Settings },
  { title: "Help", url: "/", icon: HelpCircle },
  { title: "Alerts", url: "/", icon: Bell },
  { title: "Profile", url: "/", icon: User },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="none" className="w-16 border-r border-sidebar-border">
      <SidebarHeader className="items-center py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
      </SidebarHeader>

      <SidebarContent className="items-center">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="items-center gap-1">
              {primary.map((item) => (
                <SidebarMenuItem key={item.title + item.icon.displayName}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-10 w-10 justify-center p-0 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-[18px] w-[18px]" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="items-center pb-4">
        <SidebarMenu className="items-center gap-1">
          {utility.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className="h-10 w-10 justify-center p-0 text-muted-foreground"
              >
                <item.icon className="h-[18px] w-[18px]" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
