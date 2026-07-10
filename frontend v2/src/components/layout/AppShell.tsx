import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { igreja, usuario } = useAuth();
  const titulo =
    usuario?.perfil === "superadmin" ? "Painel Superadmin" : igreja?.nome ?? "Igreja do Nazareno";

  return (
    <div className="min-h-screen bg-[#faf7f2] flex w-full">
      <aside className="hidden md:block w-72 shrink-0">
        <div className="fixed inset-y-0 w-72">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden flex items-center gap-3 border-b border-stone-200 bg-[#faf7f2] px-4 py-3 sticky top-0 z-10">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Abrir menu"
                className="grid place-content-center h-9 w-9 hover:bg-stone-200"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 bg-stone-950 border-none">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="font-serif text-stone-900 truncate">{titulo}</p>
        </header>

        <main className="flex-1 px-6 py-10 sm:px-10 lg:px-14 lg:py-14 max-w-[1400px] w-full">{children}</main>
      </div>
    </div>
  );
}