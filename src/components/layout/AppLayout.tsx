import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();

  return (
    <main
      className={cn(
        "flex-1 flex flex-col min-h-screen transition-[margin-left] duration-200 ease-linear",
        !isMobile && open && "md:ml-48"
      )}
    >
      <header className="flex h-14 items-center border-b border-border bg-background px-4">
        <SidebarTrigger />
      </header>
      <div className="flex-1 p-6">{children}</div>
    </main>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <MainContent>{children}</MainContent>
    </SidebarProvider>
  );
}
