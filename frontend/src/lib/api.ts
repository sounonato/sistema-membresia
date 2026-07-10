const BASE_URL = "http://localhost:3031/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || "Erro na requisição");
  }
  if (res.status === 204) return null;
  return res.json();
}

async function publicRequest(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || "Erro na requisição");
  }
  if (res.status === 204) return null;
  return res.json();
}

async function requestMultipart(path: string, body: FormData) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || "Erro na requisição");
  }
  return res.json();
}

export const api = {
  login: (email: string, senha: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),
  me: () => request("/auth/me"),

  getIgrejas: () => request("/igrejas"),
  createIgreja: (data: unknown) =>
    request("/igrejas", { method: "POST", body: JSON.stringify(data) }),
  updateIgreja: (id: string, data: unknown) =>
    request(`/igrejas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteIgreja: (id: string) =>
    request(`/igrejas/${id}`, { method: "DELETE" }),
  createAdminIgreja: (igrejaId: string, data: unknown) =>
    request(`/igrejas/${igrejaId}/admin`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getConvertidos: () => request("/convertidos"),
  getConvertido: (id: string) => request(`/convertidos/${id}`),
  createConvertido: (data: unknown) =>
    request("/convertidos", { method: "POST", body: JSON.stringify(data) }),
  updateConvertido: (id: string, data: unknown) =>
    request(`/convertidos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteConvertido: (id: string) =>
    request(`/convertidos/${id}`, { method: "DELETE" }),

  getGrupos: () => request("/discipulado/grupos"),
  getGrupo: (id: string) => request(`/discipulado/grupos/${id}`),
  createGrupo: (data: unknown) =>
    request("/discipulado/grupos", { method: "POST", body: JSON.stringify(data) }),
  updateGrupo: (id: string, data: unknown) =>
    request(`/discipulado/grupos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  addMembro: (grupoId: string, convertidoId: string) =>
    request(`/discipulado/grupos/${grupoId}/membros`, {
      method: "POST",
      body: JSON.stringify({ convertido_id: convertidoId }),
    }),
  removeMembro: (grupoId: string, convertidoId: string) =>
    request(`/discipulado/grupos/${grupoId}/membros/${convertidoId}`, { method: "DELETE" }),
  getProgresso: (grupoId: string) => request(`/discipulado/grupos/${grupoId}/progresso`),
  addProgresso: (grupoId: string, data: unknown) =>
    request(`/discipulado/grupos/${grupoId}/progresso`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDiscipuladores: () => request("/discipuladores"),
  createDiscipulador: (data: unknown) =>
    request("/discipuladores", { method: "POST", body: JSON.stringify(data) }),
  updateDiscipulador: (id: string, data: unknown) =>
    request(`/discipuladores/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDiscipulador: (id: string) =>
    request(`/discipuladores/${id}`, { method: "DELETE" }),

  getModulos: () => request("/modulos"),
  createModulo: (data: unknown) =>
    request("/modulos", { method: "POST", body: JSON.stringify(data) }),
  updateModulo: (id: string, data: unknown) =>
    request(`/modulos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteModulo: (id: string) =>
    request(`/modulos/${id}`, { method: "DELETE" }),

  getUsuarios: () => request("/auth/usuarios"),
  createUsuario: (data: unknown) =>
    request("/auth/usuarios", { method: "POST", body: JSON.stringify(data) }),
  toggleUsuario: (id: string) =>
    request(`/auth/usuarios/${id}/toggle`, { method: "PATCH" }),

  getDashboardStats: () => request("/dashboard/stats"),

  chatManual: (pergunta: string, historico: { role: string; content: string }[]) =>
    request("/manual/chat", {
      method: "POST",
      body: JSON.stringify({ pergunta, historico }),
    }),

  // ===== Endpoints públicos (cadastro via QR) =====
  getIgrejaPublica: (slug: string) => publicRequest(`/publico/igrejas/${slug}`),
  getGruposPublicos: (slug: string) =>
    publicRequest(`/publico/igrejas/${slug}/grupos`),
  cadastroPublico: (slug: string, data: unknown) =>
    publicRequest(`/publico/igrejas/${slug}/cadastro`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  atualizarIgreja: (id: string, data: Partial<Igreja>) =>
    request(`/igrejas/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  uploadLogoIgreja: (id: string, file: File) => {
    const form = new FormData();
    form.append("logo", file);
    return requestMultipart(`/igrejas/${id}/logo`, form);
  },
};

export type Perfil = "superadmin" | "admin" | "lider" | "pastor" | "discipulador";
export type Igreja = {
  id: string;
  nome: string;
  slug: string;
  ativa?: boolean;
  plano?: string;
  cor_primaria?: string;
  logo_url?: string;
  descricao?: string;
  cidade?: string;
  estado?: string;
};
export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo?: boolean;
  igreja?: Igreja | null;
  igreja_id?: string | null;
  igreja_nome?: string | null;
  igreja_slug?: string | null;
};

export function podeEditar(perfil?: Perfil) {
  return perfil === "admin" || perfil === "lider";
}

export function ehSuperadmin(perfil?: Perfil) {
  return perfil === "superadmin";
}
