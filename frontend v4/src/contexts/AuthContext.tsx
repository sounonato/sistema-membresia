import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Igreja, type Usuario } from "@/lib/api";

type AuthCtx = {
  usuario: Usuario | null;
  token: string | null;
  slug: string | null;
  igreja: Igreja | null;
  loading: boolean;
  login: (email: string, senha: string, slug?: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null,
  );
  const [slug, setSlug] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("slug") : null,
  );
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);

  useEffect(() => {
    let alive = true;
    if (!token) {
      setUsuario(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .me()
      .then((u: Usuario) => {
        if (alive) setUsuario(u);
      })
      .catch(() => {
        if (!alive) return;
        localStorage.removeItem("token");
        setToken(null);
        setUsuario(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  async function login(email: string, senha: string, slugIgreja?: string) {
    const res = await api.login(email, senha, slugIgreja);
    const t = res.token ?? res.access_token;
    if (!t) throw new Error("Token não retornado pelo servidor");
    const slugFinal = slugIgreja ?? res.usuario?.igreja_slug ?? "";
    localStorage.setItem("token", t);
    localStorage.setItem("slug", slugFinal);
    setToken(t);
    setSlug(slugFinal);
    if (res.usuario) setUsuario(res.usuario);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("slug");
    setToken(null);
    setSlug(null);
    setUsuario(null);
  }

  return (
    <Ctx.Provider
      value={{
        usuario,
        token,
        slug,
        igreja:
          usuario?.igreja ??
          ((usuario as unknown as Record<string, string>)?.igreja_nome
            ? {
                id: usuario?.igreja_id ?? "",
                nome: (usuario as unknown as Record<string, string>).igreja_nome,
                slug: (usuario as unknown as Record<string, string>).igreja_slug ?? "",
                cor_primaria: usuario?.igreja_cor,
                logo_url: usuario?.igreja_logo,
              }
            : null),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
