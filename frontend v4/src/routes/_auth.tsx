import { Outlet, createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
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
const ADMIN_ONLY_ROUTES = ["/usuarios"];
const LEADER_ROUTES = ["/relatorios", "/followup-whatsapp"]; // admin, lider, pastor

function AuthLayout() {
  const { token, loading, usuario } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!token) navigate({ to: "/login" });
  }, [token, navigate]);

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
    if (
      ADMIN_ONLY_ROUTES.some((p) => pathname.startsWith(p)) &&
      !(usuario.perfil === "admin" || usuario.perfil === "lider")
    ) {
      navigate({ to: "/dashboard" });
    }
    if (
      LEADER_ROUTES.some((p) => pathname.startsWith(p)) &&
      !["admin", "lider", "pastor"].includes(usuario.perfil)
    ) {
      navigate({ to: "/dashboard" });
    }
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