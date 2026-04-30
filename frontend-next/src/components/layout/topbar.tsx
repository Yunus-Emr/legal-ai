"use client";

import { Search, Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar"; // Assuming we extract sidebar content to be reusable in sheet if needed, or just a generic mobile menu.

export function TopBar() {
  return (
    <header className="h-[64px] flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-[rgba(17,24,39,0.7)] backdrop-blur-[12px] border-b border-[#1E2D45] sticky top-0 z-10">
      
      {/* Mobile Menu */}
      <div className="md:hidden mr-2">
        <Sheet>
          {/* @ts-ignore */}
          <SheetTrigger asChild>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] bg-surface border-border">
             {/* We can render the Sidebar component here for mobile drawer */}
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
        <Tooltip>
          {/* @ts-ignore */}
          <TooltipTrigger asChild>
            <button className="p-2 rounded-full hover:bg-elevated text-muted-foreground hover:text-foreground transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface"></span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="text-xs">
            Notifications
          </TooltipContent>
        </Tooltip>

        <div className="h-6 w-px bg-border mx-1 md:mx-2"></div>

        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium leading-none font-sans">Atty. Yilmaz</p>
            <p className="text-xs text-muted-foreground mt-1 font-sans">Senior Partner</p>
          </div>
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary font-medium text-xs font-sans">YIL</AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
