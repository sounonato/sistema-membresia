import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpenText,
  ChartColumn,
  Church,
  CircleGauge,
  Files,
  FolderKanban,
  LayoutDashboard,
  Link2,
  LogOut,
  Moon,
  Network,
  ScanFace,
  ShieldCheck,
  Sun,
  Users,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type Section = {
  label: string;
  items: {
    to: string;
    label: string;
    icon: LucideIcon;
    perfis: readonly string[];
    slugContains?: string;
  }[];
};

const sections: Section[] = [
  {
    label: "Superadmin",
    items: [{ to: "/igrejas", label: "Igrejas", icon: Church, perfis: ["superadmin"] }],
  },
  {
    label: "Pastoral",
    items: [
      {
        to: "/dashboard",
        label: "Panorama",
        icon: CircleGauge,
        perfis: ["admin", "lider", "pastor", "discipulador"],
      },
      {
        to: "/convertidos",
        label: "Convertidos",
        icon: ScanFace,
        perfis: ["admin", "lider", "pastor", "discipulador"],
      },
      {
        to: "/discipulado",
        label: "Discipulado",
        icon: FolderKanban,
        perfis: ["admin", "lider", "pastor"],
      },
      {
        to: "/discipuladores",
        label: "Discipuladores",
        icon: Users,
        perfis: ["admin", "lider", "pastor"],
      },
    ],
  },
  {
    label: "Ministério",
    items: [
      {
        to: "/modulos",
        label: "Módulos",
        icon: BookOpenText,
        perfis: ["admin", "lider", "pastor"],
      },
      {
        to: "/relatorios",
        label: "Relatórios",
        icon: ChartColumn,
        perfis: ["admin", "lider", "pastor"],
      },
      {
        to: "/qr-cadastro",
        label: "QR de cadastro",
        icon: Link2,
        perfis: ["admin", "lider", "pastor"],
      },
      {
        to: "/manual",
        label: "Manual",
        icon: Files,
        perfis: ["admin", "lider", "pastor"],
        slugContains: "nazareno",
      },
    ],
  },
  {
    label: "Membresia",
    items: [
      { to: "/membros", label: "Membros", icon: Users, perfis: ["admin", "lider", "pastor"] },
      {
        to: "/membros-metricas",
        label: "Métricas",
        icon: LayoutDashboard,
        perfis: ["admin", "lider", "pastor"],
      },
      {
        to: "/ministerios",
        label: "Ministérios",
        icon: Church,
        perfis: ["admin", "lider", "pastor"],
      },
      {
        to: "/followup-whatsapp",
        label: "Follow-up",
        icon: Network,
        perfis: ["admin", "lider", "pastor"],
      },
    ],
  },
  {
    label: "Administração",
    items: [
      { to: "/usuarios", label: "Usuários", icon: UserRound, perfis: ["admin", "lider"] },
      { to: "/migracao", label: "Migração", icon: ShieldCheck, perfis: ["admin", "lider"] },
    ],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { usuario, igreja, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const shellBg = "var(--color-shell, var(--color-sidebar, #150918))";
  const shellFg = "var(--color-shell-foreground, var(--color-sidebar-foreground, #e8dcc8))";
  const shellMuted = "var(--color-shell-muted, var(--color-muted-foreground))";
  const shellBorder = "var(--color-shell-border, var(--color-sidebar-border))";
  const shellAccent = "var(--color-shell-accent, var(--primary, #4a0e2e))";

  const igrejaSlug = igreja?.slug ?? "";
  const visibleSections = sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => {
        if (!usuario || !i.perfis.includes(usuario.perfil)) return false;
        if (i.slugContains && !igrejaSlug.includes(i.slugContains)) return false;
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <div
      className="flex h-full flex-col bg-shell text-shell-foreground"
      style={{ background: shellBg, color: shellFg }}
    >
      <div className="border-b border-shell-border px-5 py-6" style={{ borderColor: shellBorder }}>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-content-center border border-shell-border bg-shell-accent/10 text-shell-accent">
            {usuario?.igreja_logo ? (
              <img
                src={usuario.igreja_logo}
                alt={usuario.igreja_nome ?? "Logo"}
                className="h-7 w-7 object-contain"
              />
            ) : (
              <span className="font-serif text-xl leading-none">
                {(usuario?.igreja_nome ?? "O")[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg leading-none text-shell-foreground">
              {usuario?.igreja_nome ?? "Painel global"}
            </p>
            <p
              className="mt-1 text-[10px] uppercase tracking-[0.3em]"
              style={{ color: shellMuted }}
            >
              {usuario?.perfil === "superadmin"
                ? "Global"
                : igreja?.slug
                  ? `@${igreja.slug}`
                  : "Ovile"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className="border border-shell-border px-2 py-1 text-[10px] uppercase tracking-[0.22em]"
            style={{ color: shellMuted }}
          >
            Operacional
          </span>
          <span
            className="border border-shell-border px-2 py-1 text-[10px] uppercase tracking-[0.22em]"
            style={{ color: shellMuted }}
          >
            {usuario?.perfil ?? "perfil"}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {visibleSections.map((section, idx) => (
          <div key={section.label} className="mb-6 last:mb-0">
            <div className="mb-3 flex items-center gap-3 px-1">
              <span
                className="text-[10px] tabular-nums uppercase tracking-[0.3em]"
                style={{ color: shellMuted }}
              >
                0{idx + 1}
              </span>
              <span className="h-px flex-1" style={{ background: shellBorder }} />
              <span
                className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: shellMuted }}
              >
                {section.label}
              </span>
            </div>
            <div className="space-y-1">
              {section.items.map((it) => {
                const active = pathname === it.to || pathname.startsWith(`${it.to}/`);
                const itemLabel =
                  it.to === "/convertidos" && usuario?.perfil === "discipulador"
                    ? "Meus convertidos"
                    : it.label;
                const Icon = it.icon;

                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-white/5 text-shell-foreground"
                        : "text-shell-muted hover:bg-white/5 hover:text-shell-foreground",
                    )}
                    style={{ borderLeftColor: active ? shellAccent : "transparent" }}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 place-content-center border transition-colors",
                        active
                          ? "border-shell-accent bg-shell-accent/15 text-shell-accent"
                          : "border-shell-border bg-transparent",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{itemLabel}</span>
                    {active && <span className="h-2 w-2 bg-shell-accent" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-shell-border p-4" style={{ borderColor: shellBorder }}>
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-content-center border border-shell-border bg-shell-accent text-shell-accent-foreground">
              {usuario.nome?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-shell-foreground">{usuario.nome}</p>
              <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: shellMuted }}>
                {usuario.perfil}
              </p>
            </div>
            <button
              onClick={toggle}
              title={isDark ? "Modo claro" : "Modo escuro"}
              className="grid h-9 w-9 place-content-center border border-shell-border transition-colors hover:bg-white/5"
              style={{ color: shellMuted }}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        )}
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="mt-4 flex w-full items-center justify-between border border-shell-border px-3 py-2 text-[10px] uppercase tracking-[0.28em] transition-colors hover:bg-white/5"
          style={{ color: shellMuted }}
        >
          <span>Encerrar sessão</span>
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
