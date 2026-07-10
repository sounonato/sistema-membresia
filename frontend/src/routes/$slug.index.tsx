import { createFileRoute, Link } from "@tanstack/react-router";
import { useIgreja } from "./$slug";
import { Church, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/$slug/")({
  component: SlugIndexPage,
});

function SlugIndexPage() {
  const { igreja } = useIgreja();

  const logoSrc = igreja.logo_url
    ? (igreja.logo_url.startsWith("http") ? igreja.logo_url : `http://localhost:3031${igreja.logo_url}`)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-radial from-slate-900 via-slate-950 to-black text-slate-100">
      {/* Dynamic Background Blur / Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none overflow-hidden opacity-30 select-none">
        <div 
          className="absolute -top-[200px] left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ backgroundColor: igreja.cor_primaria ?? "#b45309" }}
        />
        <div 
          className="absolute -top-[100px] right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-60"
          style={{ backgroundColor: "#4f46e5" }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative z-10">
        <Card className="w-full max-w-2xl bg-slate-950/60 backdrop-blur-xl border-slate-800/80 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 md:p-12 flex flex-col items-center text-center space-y-8">
            
            {/* Logo Section */}
            <div className="relative">
              {logoSrc ? (
                <div className="h-24 w-24 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900/80 p-2 shadow-inner flex items-center justify-center">
                  <img 
                    src={logoSrc} 
                    alt={`Logo da igreja ${igreja.nome}`} 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div 
                  className="grid place-content-center h-24 w-24 rounded-2xl text-slate-950 shadow-md"
                  style={{ backgroundColor: igreja.cor_primaria ?? "#b45309" }}
                >
                  <Church className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Church Name & Info */}
            <div className="space-y-4 max-w-lg">
              <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-white font-medium">
                {igreja.nome}
              </h1>
              
              {igreja.descricao ? (
                <p className="text-base text-slate-350 leading-relaxed font-light">
                  {igreja.descricao}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  Seja muito bem-vindo à nossa comunidade. Um lugar de acolhimento, fé e comunhão.
                </p>
              )}
            </div>

            {/* Location Badge */}
            {(igreja.cidade || igreja.estado) && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-medium">
                <MapPin className="h-4 w-4" style={{ color: igreja.cor_primaria ?? "#b45309" }} />
                <span>
                  {[igreja.cidade, igreja.estado].filter(Boolean).join(" - ")}
                </span>
              </div>
            )}

            {/* Access Button */}
            <div className="w-full pt-4">
              <Link to="/$slug/login" params={{ slug: igreja.slug }} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-8 rounded-xl font-medium text-slate-950 transition-all duration-300 hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  style={{ 
                    backgroundColor: igreja.cor_primaria ?? "#b45309",
                    boxShadow: `0 4px 20px -2px ${(igreja.cor_primaria ?? "#b45309")}40`
                  }}
                >
                  Acessar o sistema
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-slate-900/60 relative z-10">
        <p className="text-xs text-slate-500">
          Sistema de Membresia · Powered by Nazareno Software
        </p>
      </footer>
    </div>
  );
}
