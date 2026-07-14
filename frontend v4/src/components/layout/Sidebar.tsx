import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type Section = {
  label: string;
  items: {
    to: string;
    label: string;
    perfis: readonly string[];
    slugContains?: string;
  }[];
};

const sections: Section[] = [
  {
    label: "Superadmin",
    items: [{ to: "/igrejas", label: "Igrejas", perfis: ["superadmin"] }],
  },
  {
    label: "Pastoral",
    items: [
      { to: "/dashboard", label: "Panorama", perfis: ["admin", "lider", "pastor", "discipulador"] },
      { to: "/convertidos", label: "Convertidos", perfis: ["admin", "lider", "pastor", "discipulador"] },
      { to: "/discipulado", label: "Discipulado", perfis: ["admin", "lider", "pastor"] },
      { to: "/discipuladores", label: "Discipuladores", perfis: ["admin", "lider", "pastor"] },
    ],
  },
  {
    label: "Ministério",
    items: [
      { to: "/modulos", label: "Módulos", perfis: ["admin", "lider", "pastor"] },
      { to: "/relatorios", label: "Relatórios", perfis: ["admin", "lider", "pastor"] },
      { to: "/qr-cadastro", label: "QR de cadastro", perfis: ["admin", "lider", "pastor"] },
      { to: "/manual", label: "Manual", perfis: ["admin", "lider", "pastor"], slugContains: "nazareno" },
    ],
  },
  {
    label: "Membresia",
    items: [
      { to: "/membros", label: "Membros", perfis: ["admin", "lider", "pastor"] },
      { to: "/membros-metricas", label: "Métricas", perfis: ["admin", "lider", "pastor"] },
      { to: "/ministerios", label: "Ministérios", perfis: ["admin", "lider", "pastor"] },
      { to: "/followup-whatsapp", label: "Follow-up", perfis: ["admin", "lider", "pastor"] },
    ],
  },
  {
    label: "Administração",
    items: [
      { to: "/usuarios", label: "Usuários", perfis: ["admin", "lider"] },
      { to: "/migracao", label: "Migração", perfis: ["admin", "lider"] },
    ],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { usuario, igreja, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  // Cor de acento da sidebar: usa --primary da igreja ou velvet padrão
  const accentColor = "var(--primary, #4a0e2e)";

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--color-sidebar, #150918)", color: "var(--color-sidebar-foreground, #e8dcc8)" }}>
      {/* Logo / Nome da igreja */}
      <div className="px-6 pt-7 pb-6" style={{ borderBottom: "1px solid oklch(1 0 0 / 10%)" }}>
        {usuario?.igreja_logo ? (
          <img
            src={usuario.igreja_logo}
            alt={usuario.igreja_nome ?? "Logo"}
            className="h-8 w-auto object-contain mt-1"
          />
        ) : (
          <p className="font-serif text-xl leading-tight mt-1 truncate" style={{ color: "var(--color-sidebar-foreground, #e8dcc8)" }}>
            {usuario?.igreja_nome ?? "Ovile"}<span style={{ color: accentColor }}>.</span>
          </p>
        )}
        <p className="text-[10px] tracking-[0.3em] uppercase mt-2 truncate" style={{ color: "oklch(0.55 0.06 349)" }}>
          {usuario?.perfil === "superadmin"
            ? "— Painel superadmin"
            : igreja?.slug
              ? `— @${igreja.slug}`
              : "— Ovile"}
        </p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        {visibleSections.map((section, idx) => (
          <div key={section.label}>
            <p className="px-2 text-[10px] tracking-[0.3em] uppercase mb-2 flex items-center gap-2" style={{ color: "oklch(0.45 0.06 349)" }}>
              <span className="tabular-nums">0{idx + 1}</span>
              <span className="h-px flex-1" style={{ background: "oklch(1 0 0 / 10%)" }} />
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((it) => {
                const active = pathname === it.to || pathname.startsWith(it.to + "/");
                const itemLabel = it.to === "/convertidos" && usuario?.perfil === "discipulador" ? "Meus Convertidos" : it.label;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-baseline gap-3 px-2 py-2 text-sm border-l-2 transition-colors",
                        active ? "font-medium" : "",
                      )}
                      style={{
                        borderLeftColor: active ? accentColor : "transparent",
                        color: active
                          ? "var(--color-sidebar-foreground, #e8dcc8)"
                          : "oklch(0.55 0.06 349)",
                      }}
                    >
                      <span
                        className="font-editorial italic text-xs w-4 tabular-nums transition-colors"
                        style={{ color: active ? accentColor : "oklch(0.38 0.06 349)" }}
                      >
                        &mdash;
                      </span>
                      <span className="font-serif tracking-tight">{itemLabel}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Rodapé: usuário + toggle + sair */}
      <div className="p-4 space-y-3" style={{ borderTop: "1px solid oklch(1 0 0 / 10%)" }}>
        {usuario && (
          <div className="flex items-center gap-3 px-2">
            <div
              className="grid place-content-center h-10 w-10 rounded-full font-serif text-lg shrink-0"
              style={{ background: accentColor, color: "var(--color-sidebar-foreground, #e8dcc8)" }}
            >
              {usuario.nome?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: "var(--color-sidebar-foreground, #e8dcc8)" }}>{usuario.nome}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "oklch(0.45 0.06 349)" }}>
                {usuario.perfil}
              </p>
            </div>
            {/* Toggle dark mode */}
            <button
              onClick={toggle}
              title={isDark ? "Modo claro" : "Modo escuro"}
              className="shrink-0 p-1.5 rounded-md transition-colors hover:opacity-80"
              style={{ color: "oklch(0.55 0.06 349)" }}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="flex w-full items-center justify-between gap-2 px-2 py-2 text-xs uppercase tracking-widest transition-colors hover:opacity-80"
          style={{ borderTop: "1px solid oklch(1 0 0 / 5%)", color: "oklch(0.45 0.06 349)" }}
        >
          <span>Encerrar sessão</span>
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
