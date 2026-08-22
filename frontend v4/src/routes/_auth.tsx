import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

const SUPERADMIN_ROUTES = ["/igrejas"];
const ROLE_ROUTES: Array<{ prefixes: string[]; roles: string[] }> = [
  {
    prefixes: ["/usuarios", "/discipuladores", "/modulos", "/migracao"],
    roles: ["admin", "lider"],
  },
  { prefixes: ["/membros", "/ministerios"], roles: ["admin", "lider", "pastor"] },
  {
    prefixes: ["/relatorios", "/followup-whatsapp", "/qr-cadastro"],
    roles: ["admin", "lider", "pastor"],
  },
  { prefixes: ["/convertidos"], roles: ["admin", "lider", "pastor", "discipulador"] },
  { prefixes: ["/discipulado"], roles: ["admin", "lider", "pastor", "discipulador"] },
];

function AuthLayout() {
  const { token, loading, usuario } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!token) navigate({ to: "/login" });
  }, [token, navigate]);

  useEffect(() => {
    const cor = usuario?.igreja?.cor_primaria ?? usuario?.igreja_cor;
    if (cor) {
      document.documentElement.style.setProperty("--primary", cor);
    } else {
      document.documentElement.style.removeProperty("--primary");
    }
    return () => {
      document.documentElement.style.removeProperty("--primary");
    };
  }, [usuario?.igreja?.cor_primaria, usuario?.igreja_cor]);

  useEffect(() => {
    if (!usuario) return;

    if (usuario.deve_trocar_senha && pathname !== "/trocar-senha") {
      navigate({ to: "/trocar-senha" });
      return;
    }

    const isSuper = usuario.perfil === "superadmin";
    const inSuperArea = SUPERADMIN_ROUTES.some((p) => pathname.startsWith(p));
    if (isSuper && !inSuperArea) {
      navigate({ to: "/igrejas" });
      return;
    }
    if (!isSuper && inSuperArea) {
      navigate({ to: "/dashboard" });
      return;
    }
    const regra = ROLE_ROUTES.find(({ prefixes }) => prefixes.some((p) => pathname.startsWith(p)));
    if (regra && !regra.roles.includes(usuario.perfil)) navigate({ to: "/dashboard" });
  }, [usuario, pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-content-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
