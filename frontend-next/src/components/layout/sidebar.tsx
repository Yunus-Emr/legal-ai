"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale,
  LayoutDashboard,
  MessageSquareText,
  Briefcase,
  FileText,
  Search,
  FileSignature,
  Edit3,
  ShieldCheck,
  MessageSquare,
  Globe,
  BarChart,
  CreditCard,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/authStore";

const NAVIGATION = [
  {
    category: "WORKSPACE",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      { label: "AI Assistant", icon: MessageSquareText, href: "/ai-canvas" },
      { label: "My Cases", icon: Briefcase, href: "/cases" },
      { label: "Documents", icon: FileText, href: "/documents" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
  {
    category: "LEGAL TOOLS",
    items: [
      { label: "Legal Research", icon: Search, href: "/research" },
      { label: "Contract Analysis", icon: FileSignature, href: "/contracts" },
      { label: "Drafting", icon: Edit3, href: "/drafting" },
      { label: "Compliance", icon: ShieldCheck, href: "/compliance" },
    ],
  },
  {
    category: "MANAGEMENT",
    items: [
      { label: "Analytics", icon: BarChart, href: "/analytics" },
    ],
  },
];

const ADMIN_ITEM = { label: "Admin Panel", icon: ShieldAlert, href: "/admin" };

/* ── NavItem: nav link with optional tooltip when collapsed ───────────── */
function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  isAdmin = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  isAdmin?: boolean;
}) {
  const linkEl = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
        isAdmin
          ? isActive
            ? "bg-destructive/10 text-destructive border-l-2 border-destructive"
            : "text-muted-foreground hover:bg-[#1A2235] hover:text-foreground"
          : isActive
          ? "active-nav-glow"
          : "text-muted-foreground hover:bg-[#1A2235] hover:text-foreground",
        isCollapsed ? "justify-center px-2" : ""
      )}
    >
      <Icon
        className={cn(
          "w-4 h-4 transition-colors shrink-0",
          isAdmin
            ? isActive
              ? "text-destructive"
              : "text-muted-foreground group-hover:text-foreground"
            : isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {!isCollapsed && <span className="shrink-0">{label}</span>}
    </Link>
  );

  if (!isCollapsed) return linkEl;

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className="w-full block"
      >
        {linkEl}
      </TooltipTrigger>
      <TooltipContent side="right" className="ml-2 bg-[#1A2235] text-foreground border-border">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── LogoutButton: standalone button, NOT nested in TooltipTrigger asChild ── */
function LogoutButton({
  isCollapsed,
  onClick,
}: {
  isCollapsed: boolean;
  onClick: () => void;
}) {
  if (!isCollapsed) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all w-full"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Sign out</span>
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className="w-full block"
        onClick={onClick}
      >
        <span className="flex items-center justify-center w-full py-2 px-2 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer">
          <LogOut className="w-4 h-4 shrink-0" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" className="ml-2 bg-[#1A2235] text-foreground border-border">
        Sign out
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    document.cookie = "lexai_token=; path=/; max-age=0";
    document.cookie = "lexai_role=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "flex-shrink-0 flex flex-col h-full glass-panel relative z-20 transition-all duration-300 border-y-0 border-l-0 rounded-none",
        isCollapsed ? "w-[64px]" : "w-[260px]"
      )}
    >
      {/* Collapse Toggle */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-[#1A2235] border border-border rounded-full p-1 text-muted-foreground hover:text-foreground z-30 shadow-md"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary/10 text-primary p-2 rounded-lg border border-primary/20 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg tracking-tight shrink-0">LexAI</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6 overflow-x-hidden">
        {NAVIGATION.map((section, idx) => {
          if (section.category === "MANAGEMENT" && !isAdmin) return null;

          let itemsToRender = section.items;
          if (section.category === "LEGAL TOOLS" && !isAdmin) {
            itemsToRender = itemsToRender.filter(
              (item) => item.label !== "Compliance"
            );
          }
          if (itemsToRender.length === 0) return null;

          return (
            <div key={idx} className="px-3">
              {!isCollapsed && (
                <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2 px-3">
                  {section.category}
                </div>
              )}
              {isCollapsed && <div className="h-3" />}

              <nav className="space-y-1">
                {itemsToRender.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={pathname === item.href}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </nav>
            </div>
          );
        })}

        {/* Admin only */}
        {isAdmin && (
          <div className="px-3">
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-destructive/60 uppercase tracking-widest mb-2 px-3">
                ADMIN
              </div>
            )}
            <nav>
              <NavItem
                href={ADMIN_ITEM.href}
                icon={ADMIN_ITEM.icon}
                label={ADMIN_ITEM.label}
                isActive={pathname === ADMIN_ITEM.href}
                isCollapsed={isCollapsed}
                isAdmin
              />
            </nav>
          </div>
        )}
      </div>

      {/* User Area Footer */}
      <div className="p-4 border-t border-border mt-auto">
        {!isCollapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        <LogoutButton isCollapsed={isCollapsed} onClick={handleLogout} />
      </div>
    </aside>
  );
}
