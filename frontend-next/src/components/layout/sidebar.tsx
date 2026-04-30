"use client";

import { useState } from "react";
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
  Users,
  MessageSquare,
  Globe,
  BarChart,
  CreditCard,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAVIGATION = [
  {
    category: "WORKSPACE",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      { label: "AI Assistant", icon: MessageSquareText, href: "/ai-canvas" },
      { label: "My Cases", icon: Briefcase, href: "/cases" },
      { label: "Documents", icon: FileText, href: "/documents" },
    ]
  },
  {
    category: "LEGAL TOOLS",
    items: [
      { label: "Legal Research", icon: Search, href: "/research" },
      { label: "Contract Analysis", icon: FileSignature, href: "/contracts" },
      { label: "Drafting", icon: Edit3, href: "/drafting" },
      { label: "Compliance", icon: ShieldCheck, href: "/compliance" },
    ]
  },
  {
    category: "COLLABORATION",
    items: [
      { label: "Team Workspace", icon: Users, href: "/team" },
      { label: "Comments", icon: MessageSquare, href: "/comments" },
      { label: "Client Portal", icon: Globe, href: "/portal" },
    ]
  },
  {
    category: "MANAGEMENT",
    items: [
      { label: "Analytics", icon: BarChart, href: "/analytics" },
      { label: "Billing", icon: CreditCard, href: "/billing" },
      { label: "Settings", icon: Settings, href: "/settings" },
      { label: "Admin Panel", icon: ShieldAlert, href: "/admin" },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "flex-shrink-0 flex flex-col h-full bg-[#111827]/95 backdrop-blur-md border-r border-border relative z-20 transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-elevated border border-border rounded-full p-1 text-muted-foreground hover:text-foreground z-30 shadow-md"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="bg-primary/10 text-primary p-2 rounded-lg border border-primary/20 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          {!isCollapsed && <span className="font-semibold text-lg tracking-tight shrink-0">LexAI</span>}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6 overflow-x-hidden">
        {NAVIGATION.map((section, idx) => (
          <div key={idx} className="px-3">
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2 px-3">
                {section.category}
              </div>
            )}
            {isCollapsed && <div className="h-4"></div>}
            
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const linkContent = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                      isActive
                        ? "active-nav-glow"
                        : "text-muted-foreground hover:bg-elevated hover:text-foreground",
                      isCollapsed ? "justify-center px-0" : ""
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4.5 h-4.5 transition-colors shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && <span className="shrink-0">{item.label}</span>}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      {/* @ts-ignore */}
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2 bg-elevated text-foreground border-border">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.href}>{linkContent}</div>;
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Area Footer */}
      <div className="p-4 border-t border-border mt-auto">
        <button className={cn(
          "flex items-center gap-3 py-2 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-all w-full",
          isCollapsed ? "justify-center px-0" : "px-3"
        )}>
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
