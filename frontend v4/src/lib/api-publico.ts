const BASE_URL = "http://localhost:3031/api";

export interface SolicitacaoIgrejaPayload {
  nome: string;
  slug: string;
  cidade?: string;
  estado?: string;
  plano: "basico" | "pro";
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone?: string;
  cargo_responsavel?: string;
  mensagem?: string;
}

export async function solicitarCadastroIgreja(payload: SolicitacaoIgrejaPayload) {
  const res = await fetch(`${BASE_URL}/publico/solicitacao-igreja`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Não foi possível enviar sua solicitação." }));
    throw new Error(err.error || "Não foi possível enviar sua solicitação.");
  }
  if (res.status === 204) return null;
  return res.json();
}