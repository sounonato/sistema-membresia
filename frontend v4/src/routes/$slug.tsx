import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { api, type Igreja } from "@/lib/api";
import { ErrorPage } from "@/components/ErrorPage";

export const Route = createFileRoute("/$slug")({
  component: SlugLayout,
});

function SlugLayout() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError } = useQuery<Igreja>({
    queryKey: ["igreja-publica", slug],
    queryFn: () => api.getIgrejaPublica(slug),
    retry: false,
  });

  useEffect(() => {
    const cor = data?.cor_primaria;
    if (cor) document.documentElement.style.setProperty("--primary", cor);
    return () => {
      document.documentElement.style.setProperty("--primary", "#b45309");
    };
  }, [data?.cor_primaria]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-content-center bg-secondary text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorPage
        code={404}
        title="Igreja não encontrada"
        description="O endereço da igreja que você acessou não existe ou foi desativado."
        detail="Verifique o link ou volte para a página inicial."
      />
    );
  }

  return <Outlet />;
}