import { Outlet, createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, Church } from "lucide-react";
import { api, type Igreja } from "@/lib/api";

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
      <div className="min-h-screen grid place-content-center bg-secondary px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto grid place-content-center h-16 w-16 rounded-2xl bg-muted text-muted-foreground">
            <Church className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-2xl text-primary">Igreja não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            Verifique o endereço ou volte para a página inicial.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}