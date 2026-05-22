"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

export function TopBar() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  // Kullanıcı bilgisi store'da yoksa /me endpoint'inden çek
  useEffect(() => {
    if (isAuthenticated && !user) {
      authApi
        .me()
        .then(({ data }) => setUser(data))
        .catch(() => {
          logout();
          router.push("/login");
        });
    }
  }, [isAuthenticated, user, setUser, logout, router]);

  const handleLogout = () => {
    logout();
    document.cookie = "lexai_token=; path=/; max-age=0";
    document.cookie = "lexai_role=; path=/; max-age=0";
    router.push("/login");
  };

  const displayName = user?.name ?? "Loading...";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "";

  return (
    <header className="h-[64px] flex-shrink-0 flex items-center justify-between px-4 md:px-6 glass-panel border-x-0 border-t-0 rounded-none sticky top-0 z-10">

      {/* Mobile Menu — SheetTrigger with render prop to avoid nested button */}
      <div className="md:hidden mr-2">
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Open menu"
              />
            }
          >
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] bg-surface border-border">
            <div className="h-full w-full overflow-hidden">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search case law, matters, or command shortcuts... (Cmd+K)"
            className="w-full bg-[#1A2235]/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary pl-10 pr-4 h-10 rounded-lg shadow-sm font-sans"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4 ml-4">
        {/* Notification bell — TooltipTrigger with render prop */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="p-2 rounded-full hover:bg-elevated text-muted-foreground hover:text-foreground transition-all relative"
                aria-label="Notifications"
              />
            }
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-[#111827]" />
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="text-xs">
            Notifications
          </TooltipContent>
        </Tooltip>

        <div className="h-6 w-px bg-border mx-1 md:mx-2" />

        {/* User avatar / logout — TooltipTrigger with render prop */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                onClick={handleLogout}
                title="Click to sign out"
                aria-label="Sign out"
              />
            }
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium leading-none font-sans">{displayName}</p>
              {displayRole && (
                <p className="text-xs text-muted-foreground mt-1 font-sans capitalize">
                  {displayRole}
                </p>
              )}
            </div>
            <Avatar className="w-9 h-9 border border-border">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/20 text-primary font-medium text-xs font-sans">
                {user ? getInitials(user.name) : "??"}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="text-xs">
            Sign out
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
