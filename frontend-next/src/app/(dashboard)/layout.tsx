import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <div className="flex h-full w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <TopBar />
          <main className="flex-1 overflow-y-auto relative bg-transparent">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
