import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, Menu, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { igreja, usuario } = useAuth();
  const titulo = usuario?.perfil === "superadmin" ? "Painel Superadmin" : (igreja?.nome ?? "Ovile");
  const hoje = useMemo(
    () =>
      new Date().toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
    [],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="xl:grid xl:min-h-screen xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden xl:block border-r border-border bg-shell text-shell-foreground">
          <div className="sticky top-0 h-screen">
            <SidebarContent />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6 xl:px-8">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button
                    aria-label="Abrir menu"
                    className="grid h-10 w-10 place-content-center border border-border bg-card transition-colors hover:bg-muted xl:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[19rem] border-none bg-shell p-0 text-shell-foreground"
                >
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SidebarContent onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {usuario?.perfil === "superadmin" ? "Painel global" : "Painel operacional"}
                  </span>
                </div>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground sm:text-base">
                    {titulo}
                  </p>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="truncate text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {usuario?.perfil ?? "acesso"}
                  </span>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 border border-border bg-card px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground",
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  {hoje}
                </span>
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
            <div className="mx-auto w-full max-w-[1500px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
