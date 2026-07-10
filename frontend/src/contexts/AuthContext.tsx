import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Igreja, type Usuario } from "@/lib/api";

type AuthCtx = {
  usuario: Usuario | null;
  token: string | null;
  igreja: Igreja | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null,
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

  async function login(email: string, senha: string) {
    const res = await api.login(email, senha);
    const t = res.token ?? res.access_token;
    if (!t) throw new Error("Token não retornado pelo servidor");
    localStorage.setItem("token", t);
    setToken(t);
    if (res.usuario) setUsuario(res.usuario);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUsuario(null);
  }

  return (
    <Ctx.Provider
      value={{ usuario, token, igreja: usuario?.igreja ?? null, loading, login, logout }}
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
