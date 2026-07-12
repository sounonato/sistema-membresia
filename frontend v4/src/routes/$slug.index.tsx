import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Church, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type Igreja } from "@/lib/api";

export const Route = createFileRoute("/$slug/")({
  component: SlugLanding,
});

function SlugLanding() {
  const { slug } = Route.useParams();
  const { data: igreja } = useQuery<Igreja>({
    queryKey: ["igreja-publica", slug],
    queryFn: () => api.getIgrejaPublica(slug),
  });

  if (!igreja) return null;

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <main className="flex-1 grid place-content-center px-4 py-12">
        <div className="max-w-xl w-full text-center space-y-6">
          {igreja.logo_url ? (
            <img
              src={igreja.logo_url}
              alt={igreja.nome}
              className="mx-auto h-24 w-24 rounded-2xl object-contain bg-white shadow-sm border border-border"
            />
          ) : (
            <div className="mx-auto grid place-content-center h-24 w-24 rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Church className="h-12 w-12" />
            </div>
          )}

          <div className="space-y-2">
            <h1 className="font-serif text-4xl sm:text-5xl text-primary">{igreja.nome}</h1>
            {(igreja.cidade || igreja.estado) && (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[igreja.cidade, igreja.estado].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {igreja.descricao && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {igreja.descricao}
            </p>
          )}

          <div className="pt-4">
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/$slug/login" params={{ slug }}>
                Acessar o sistema <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        Powered by Ovile
      </footer>
    </div>
  );
}