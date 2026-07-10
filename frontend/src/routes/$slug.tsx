import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, createContext, useContext } from "react";
import { api, type Igreja } from "@/lib/api";
import { Loader2, Church, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$slug")({
  component: SlugLayout,
});

const IgrejaContext = createContext<{ igreja: Igreja } | null>(null);

export function useIgreja() {
  const ctx = useContext(IgrejaContext);
  if (!ctx) throw new Error("useIgreja must be used within a IgrejaContext provider");
  return ctx;
}

function SlugLayout() {
  const { slug } = useParams({ from: "/$slug" });

  const { data: igreja, isLoading, isError } = useQuery<Igreja>({
    queryKey: ["igreja-publica", slug],
    queryFn: () => api.getIgrejaPublica(slug),
    retry: false,
  });

  useEffect(() => {
    if (igreja?.cor_primaria) {
      document.documentElement.style.setProperty("--primary", igreja.cor_primaria);
    }
    return () => {
      document.documentElement.style.setProperty("--primary", "#b45309");
    };
  }, [igreja?.cor_primaria]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-content-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isError || !igreja) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto grid place-content-center h-16 w-16 rounded-2xl bg-destructive/10 text-destructive">
            <Church className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-foreground">Igreja não encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A igreja com o slug <code className="bg-muted px-1.5 py-0.5 rounded">@{slug}</code> não existe ou foi desativada.
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => window.location.href = "/"} variant="outline" className="rounded-xl inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <IgrejaContext.Provider value={{ igreja }}>
      <Outlet />
    </IgrejaContext.Provider>
  );
}
