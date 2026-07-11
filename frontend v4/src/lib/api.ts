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
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || "Erro na requisição");
  }
  return res.json();
}

export const api = {
  login: (email: string, senha: string, slug: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha, slug }),
    }),
  me: () => request("/auth/me"),
  trocarSenha: (senha_atual: string, senha_nova: string) =>
    request("/autenticacao/trocar-senha", {
      method: "POST",
      body: JSON.stringify({ senha_atual, senha_nova }),
    }),
  esqueciSenha: (email: string) =>
    publicRequest("/autenticacao/esqueci-senha", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetarSenha: (token: string, senha_nova: string) =>
    publicRequest("/autenticacao/resetar-senha", {
      method: "POST",
      body: JSON.stringify({ token, senha_nova }),
    }),

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
  uploadLogoIgreja: (id: string, file: File) => {
    const form = new FormData();
    form.append("logo", file);
    return requestMultipart(`/igrejas/${id}/logo`, form);
  },

  getSolicitacoes: (status?: string) =>
    request(`/superadmin/solicitacoes${status ? `?status=${status}` : ""}`),
  aprovarSolicitacao: (id: string) =>
    request(`/superadmin/solicitacoes/${id}/aprovar`, { method: "POST" }),
  rejeitarSolicitacao: (id: string, motivo?: string) =>
    request(`/superadmin/solicitacoes/${id}/rejeitar`, {
      method: "POST",
      body: JSON.stringify({ motivo }),
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

  // ===== MEMBROS =====
  getMembros: (qs: string = "") => request(`/membros${qs}`),
  getMembro: (id: string) => request(`/membros/${id}`),
  getMembrosStats: () => request("/membros/stats"),
  getMembrosSemContato: (dias: number = 60) =>
    request(`/membros/sem-contato?dias=${dias}`),
  createMembro: (data: unknown) =>
    request("/membros", { method: "POST", body: JSON.stringify(data) }),
  updateMembro: (id: string, data: unknown) =>
    request(`/membros/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMembro: (id: string) => request(`/membros/${id}`, { method: "DELETE" }),
  viHoje: (id: string) => request(`/membros/${id}/vi-hoje`, { method: "PATCH" }),
  enviarWhatsapp: (id: string) =>
    request(`/membros/${id}/whatsapp`, { method: "POST" }),
  addMembroMinisterio: (
    membroId: string,
    data: { ministerio_id: string; cargo?: string },
  ) =>
    request(`/membros/${membroId}/ministerios`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  removeMembroMinisterio: (membroId: string, ministerioId: string) =>
    request(`/membros/${membroId}/ministerios/${ministerioId}`, {
      method: "DELETE",
    }),
  addCargo: (
    membroId: string,
    data: { cargo: string; data_posse?: string; observacoes?: string },
  ) =>
    request(`/membros/${membroId}/cargos`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  encerrarCargo: (
    membroId: string,
    cargoId: string,
    data: { data_fim?: string },
  ) =>
    request(`/membros/${membroId}/cargos/${cargoId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ===== MINISTÉRIOS =====
  getMinisterios: () => request("/ministerios"),
  getMinisterio: (id: string) => request(`/ministerios/${id}`),
  createMinisterio: (data: unknown) =>
    request("/ministerios", { method: "POST", body: JSON.stringify(data) }),
  updateMinisterio: (id: string, data: unknown) =>
    request(`/ministerios/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMinisterio: (id: string) =>
    request(`/ministerios/${id}`, { method: "DELETE" }),

  // ===== CADASTRO PÚBLICO DE MEMBRO =====
  getIgrejaCadastroMembro: (slug: string) =>
    publicRequest(`/publico/igrejas/${slug}/membros/cadastro`),
  cadastroPublicoMembro: (slug: string, data: unknown) =>
    publicRequest(`/publico/igrejas/${slug}/membros/cadastro`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
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
  deve_trocar_senha?: boolean;
  igreja?: Igreja | null;
  igreja_id?: string | null;
};

export function podeEditar(perfil?: Perfil) {
  return perfil === "admin" || perfil === "lider";
}

export function ehSuperadmin(perfil?: Perfil) {
  return perfil === "superadmin";
}

export type Membro = {
  id: string;
  igreja_id: string;
  convertido_id?: string | null;
  nome: string;
  telefone: string;
  email?: string | null;
  data_nascimento?: string | null;
  genero?: "masculino" | "feminino" | "outro" | null;
  estado_civil?:
    | "solteiro"
    | "casado"
    | "divorciado"
    | "viuvo"
    | "uniao_estavel"
    | null;
  profissao?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  data_entrada: string;
  tipo_entrada?:
    | "batismo"
    | "transferencia"
    | "aclamacao"
    | "reconciliacao"
    | null;
  data_batismo?: string | null;
  batizado: boolean;
  fez_discipulado: boolean;
  conjuge_id?: string | null;
  conjuge_nome_cadastrado?: string | null;
  nome_conjuge?: string | null;
  tem_filhos: boolean;
  qtd_filhos: number;
  ultimo_contato: string;
  dias_sem_contato?: number;
  status: "ativo" | "inativo" | "transferido" | "falecido" | "excluido";
  observacoes?: string | null;
  carta_entrada_origem?: string | null;
  carta_saida_destino?: string | null;
  data_saida?: string | null;
  motivo_saida?: string | null;
  created_at: string;
  updated_at: string;
  ministerios?: MembroMinisterio[];
  cargos?: CargoMembro[];
};

export type MembroMinisterio = {
  id: string;
  cargo?: string | null;
  data_entrada: string;
  ativo: boolean;
  ministerio_id: string;
  ministerio_nome: string;
};

export type CargoMembro = {
  id: string;
  cargo: string;
  data_posse?: string | null;
  data_fim?: string | null;
  ativo: boolean;
  observacoes?: string | null;
  created_at: string;
};

export type Ministerio = {
  id: string;
  igreja_id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  lider_id?: string | null;
  lider_nome?: string | null;
  total_membros?: number;
  membros?: MinisterioMembro[];
};

export type MinisterioMembro = {
  vinculo_id: string;
  cargo?: string | null;
  data_entrada: string;
  ativo: boolean;
  membro_id: string;
  membro_nome: string;
  telefone: string;
  genero?: string | null;
};

export type MembrosStats = {
  total: number;
  ativos: number;
  inativos: number;
  transferidos: number;
  batizados: number;
  fez_discipulado: number;
  por_genero: { genero: string; quantidade: number }[];
  por_ministerio: { ministerio: string; quantidade: number }[];
  sem_contato_60: number;
  sem_contato_90: number;
};

export type SolicitacaoIgreja = {
  id: string;
  nome: string;
  slug: string;
  cidade?: string | null;
  estado?: string | null;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone?: string | null;
  cargo_responsavel?: string | null;
  plano: string;
  mensagem?: string | null;
  status: "pendente" | "aprovada" | "rejeitada";
  motivo_rejeicao?: string | null;
  created_at: string;
  updated_at: string;
};
