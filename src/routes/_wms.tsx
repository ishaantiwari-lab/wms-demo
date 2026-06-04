import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/wms/app-sidebar";

export const Route = createFileRoute("/_wms")({
  component: WmsLayout,
});

function WmsLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger />
            <div className="text-sm font-medium text-muted-foreground">
              Warehouse Management · Outbound
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
