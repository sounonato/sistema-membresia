import { Link } from "@tanstack/react-router";

type ErrorPageProps = {
  code?: number;
  title?: string;
  description?: string;
  detail?: string;
  showBack?: boolean;
};

const ERROR_CONFIGS: Record<number, { title: string; description: string; detail: string }> = {
  400: {
    title: "Requisição inválida",
    description: "Os dados enviados não estão no formato esperado.",
    detail: "Verifique os campos e tente novamente.",
  },
  401: {
    title: "Sessão expirada",
    description: "Você precisa entrar para acessar esta página.",
    detail: "Faça login novamente para continuar.",
  },
  403: {
    title: "Acesso negado",
    description: "Você não tem permissão para acessar este recurso.",
    detail: "Se achar que é um engano, fale com o administrador da sua igreja.",
  },
  404: {
    title: "Página não encontrada",
    description: "O endereço que você acessou não existe ou foi movido.",
    detail: "Confira o endereço ou volte para o início.",
  },
  409: {
    title: "Conflito de dados",
    description: "Este registro já existe no sistema.",
    detail: "Verifique se já não há um cadastro com as mesmas informações.",
  },
  422: {
    title: "Dados inválidos",
    description: "O servidor não conseguiu processar as informações enviadas.",
    detail: "Revise os campos e tente novamente.",
  },
  429: {
    title: "Muitas tentativas",
    description: "Você fez requisições demais em pouco tempo.",
    detail: "Aguarde alguns minutos e tente novamente.",
  },
  500: {
    title: "Erro interno no servidor",
    description: "Algo deu errado do nosso lado.",
    detail: "Nossa equipe foi notificada. Tente novamente em alguns instantes.",
  },
  501: {
    title: "Recurso não implementado",
    description: "Esta funcionalidade ainda não está disponível.",
    detail: "Em breve estará disponível. Volte mais tarde.",
  },
  502: {
    title: "Serviço indisponível",
    description: "O servidor está temporariamente fora do ar.",
    detail: "Aguarde alguns minutos e tente recarregar a página.",
  },
  503: {
    title: "Serviço em manutenção",
    description: "O sistema está em manutenção no momento.",
    detail: "Voltaremos em breve. Agradecemos a paciência.",
  },
  504: {
    title: "Tempo de resposta esgotado",
    description: "O servidor demorou demais para responder.",
    detail: "Verifique sua conexão e tente novamente.",
  },
};

// Decorative character per error family
function ErrorGlyph({ code }: { code: number }) {
  if (code === 401) return <span aria-hidden>🔒</span>;
  if (code === 403) return <span aria-hidden>🚫</span>;
  if (code === 404) return <span aria-hidden>🌿</span>;
  if (code >= 500) return <span aria-hidden>⚙️</span>;
  return <span aria-hidden>⚠️</span>;
}

export function ErrorPage({ code = 500, title, description, detail, showBack = true }: ErrorPageProps) {
  const config = ERROR_CONFIGS[code] ?? ERROR_CONFIGS[500];
  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;
  const displayDetail = detail ?? config.detail;

  const is4xx = code >= 400 && code < 500;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-16 font-sans">
      {/* Decorative top line */}
      <div
        className="mb-10 h-px w-24"
        style={{ background: "var(--primary, #b45309)" }}
      />

      <div className="max-w-md text-center">
        {/* Code */}
        <p
          className="font-editorial text-[6rem] font-light leading-none tracking-tight"
          style={{ color: "var(--primary, #b45309)", opacity: 0.15 }}
        >
          {code}
        </p>

        {/* Glyph */}
        <div className="-mt-4 mb-4 text-4xl">
          <ErrorGlyph code={code} />
        </div>

        {/* Title */}
        <h1 className="font-editorial text-2xl font-semibold text-foreground">
          {displayTitle}
        </h1>

        {/* Description */}
        <p className="mt-3 text-base text-muted-foreground">{displayDescription}</p>

        {/* Detail */}
        <p className="mt-1 text-sm text-muted-foreground">{displayDetail}</p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {code === 401 ? (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors"
              style={{ background: "var(--primary, #b45309)" }}
            >
              Fazer login
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors"
              style={{ background: "var(--primary, #b45309)" }}
            >
              Voltar ao início
            </Link>
          )}

          {showBack && (
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center rounded-md border border-border bg-white px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Voltar
            </button>
          )}

          {!is4xx && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-md border border-border bg-white px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>

      {/* Bottom line */}
      <div
        className="mt-10 h-px w-24"
        style={{ background: "var(--primary, #b45309)", opacity: 0.3 }}
      />

      <p className="mt-4 text-xs text-stone-300">Ovile — Código {code}</p>
    </div>
  );
}
