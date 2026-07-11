import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.length === 10 ? dateStr + "T00:00:00" : dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function calcularIdade(dataNascStr?: string | null): number | null {
  if (!dataNascStr) return null;
  const nasc = new Date(dataNascStr);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export function formatTipoEntrada(tipo?: string | null): string {
  const mapa: Record<string, string> = {
    batismo: "Batismo",
    transferencia: "Transferência",
    aclamacao: "Aclamação",
    reconciliacao: "Reconciliação",
  };
  return tipo ? (mapa[tipo] ?? tipo) : "—";
}

export function formatEstadoCivil(ec?: string | null): string {
  const mapa: Record<string, string> = {
    solteiro: "Solteiro(a)",
    casado: "Casado(a)",
    divorciado: "Divorciado(a)",
    viuvo: "Viúvo(a)",
    uniao_estavel: "União estável",
  };
  return ec ? (mapa[ec] ?? ec) : "—";
}

export function formatGenero(g?: string | null): string {
  return g === "masculino"
    ? "Masculino"
    : g === "feminino"
      ? "Feminino"
      : g === "outro"
        ? "Outro"
        : "Não informado";
}
