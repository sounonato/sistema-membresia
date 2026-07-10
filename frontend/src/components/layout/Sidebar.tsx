import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  BookText,
  LogOut,
  Church,
  Building2,
  QrCode,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const items = [
  { to: "/igrejas", label: "Igrejas", icon: Building2, perfis: ["superadmin"] as const },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perfis: ["admin", "lider", "pastor", "discipulador"] as const },
  { to: "/convertidos", label: "Convertidos", icon: Users, perfis: ["admin", "lider", "pastor", "discipulador"] as const },
  { to: "/discipulado", label: "Discipulado", icon: HeartHandshake, perfis: ["admin", "lider", "pastor", "discipulador"] as const },
  { to: "/discipuladores", label: "Discipuladores", icon: GraduationCap, perfis: ["admin", "lider", "pastor", "discipulador"] as const },
  { to: "/modulos", label: "Módulos", icon: BookOpen, perfis: ["admin", "lider", "pastor", "discipulador"] as const },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, perfis: ["admin", "lider", "pastor"] as const },
  { to: "/usuarios", label: "Usuários", icon: ShieldCheck, perfis: ["admin", "lider"] as const },
  { to: "/qr-cadastro", label: "QR de Cadastro", icon: QrCode, perfis: ["admin", "lider", "pastor"] as const },
  { to: "/manual", label: "Consultar Manual", icon: BookText, perfis: ["admin", "lider", "pastor", "discipulador"] as const },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { usuario, igreja, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="grid place-content-center h-10 w-10 rounded-2xl bg-primary text-primary-foreground">
          <Church className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-serif text-base leading-tight text-primary truncate">
            {igreja?.nome ?? "Igreja do Nazareno"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {usuario?.perfil === "superadmin"
              ? "Painel Superadmin"
              : igreja?.slug
                ? `@${igreja.slug}`
                : "Sistema de Membresia"}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items
          .filter((it) => usuario && (it.perfis as readonly string[]).includes(usuario.perfil))
          .map((it) => {
            const active = pathname === it.to || pathname.startsWith(it.to + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{it.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-3">
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="grid place-content-center h-9 w-9 rounded-full bg-accent text-accent-foreground font-medium">
              {usuario.nome?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{usuario.nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{usuario.perfil}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );
}