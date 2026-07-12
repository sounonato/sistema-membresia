import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
      { to: "/discipulado", label: "Discipulado", perfis: ["admin", "lider", "pastor", "discipulador"] },
      { to: "/discipuladores", label: "Discipuladores", perfis: ["admin", "lider", "pastor", "discipulador"] },
    ],
  },
  {
    label: "Ministério",
    items: [
      { to: "/modulos", label: "Módulos", perfis: ["admin", "lider", "pastor", "discipulador"] },
      { to: "/relatorios", label: "Relatórios", perfis: ["admin", "lider", "pastor"] },
      { to: "/qr-cadastro", label: "QR de cadastro", perfis: ["admin", "lider", "pastor"] },
      { to: "/manual", label: "Manual", perfis: ["admin", "lider", "pastor", "discipulador"], slugContains: "nazareno" },
    ],
  },
  {
    label: "Membresia",
    items: [
      { to: "/membros", label: "Membros", perfis: ["admin", "lider", "pastor", "discipulador"] },
      { to: "/ministerios", label: "Ministérios", perfis: ["admin", "lider", "pastor", "discipulador"] },
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

  return (
    <div className="flex h-full flex-col bg-stone-950 text-stone-200">
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <p className="font-serif text-xl leading-tight text-white mt-1 truncate">
          {igreja?.nome ?? "Ovile"}
        </p>
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mt-2 truncate">
          {usuario?.perfil === "superadmin"
            ? "— Painel superadmin"
            : igreja?.slug
              ? `— @${igreja.slug}`
              : "— Ovile"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        {visibleSections.map((section, idx) => (
          <div key={section.label}>
            <p className="px-2 text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-2 flex items-center gap-2">
              <span className="tabular-nums">0{idx + 1}</span>
              <span className="h-px flex-1 bg-white/10" />
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((it) => {
                const active = pathname === it.to || pathname.startsWith(it.to + "/");
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-baseline gap-3 px-2 py-2 text-sm border-l-2 transition-colors",
                        active
                          ? "border-amber-300 text-white font-medium"
                          : "border-transparent text-stone-400 hover:text-white hover:border-white/30",
                      )}
                    >
                      <span
                        className={cn(
                          "font-editorial italic text-xs w-4 tabular-nums transition-colors",
                          active ? "text-amber-300" : "text-stone-600 group-hover:text-stone-400",
                        )}
                      >
                        &mdash;
                      </span>
                      <span className="font-serif tracking-tight">{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        {usuario && (
          <div className="flex items-center gap-3 px-2">
            <div className="grid place-content-center h-10 w-10 rounded-full bg-amber-300 text-stone-950 font-serif text-lg">
              {usuario.nome?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{usuario.nome}</p>
              <p className="text-[10px] uppercase tracking-widest text-stone-500">
                {usuario.perfil}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="flex w-full items-center justify-between gap-2 px-2 py-2 text-xs uppercase tracking-widest text-stone-400 hover:text-white transition-colors border-t border-white/5"
        >
          <span>Encerrar sessão</span>
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}