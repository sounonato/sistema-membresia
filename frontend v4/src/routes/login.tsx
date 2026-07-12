import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Church, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  component: LoginEntrada,
});

function LoginEntrada() {
  const [slug, setSlug] = useState("");
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const s = slug.trim().toLowerCase();
    if (s) navigate({ to: "/$slug/login", params: { slug: s } });
  }

  return (
    <div className="min-h-screen grid place-content-center bg-secondary px-4">
      <Card className="w-full max-w-sm rounded-2xl border-border/60 shadow-sm">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="grid place-content-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground">
              <Church className="h-8 w-8" />
            </div>
            <div>
              <p className="font-serif text-xl text-primary">Ovile</p>
              <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Acesso ao sistema</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug da sua igreja</Label>
              <Input
                id="slug"
                type="text"
                required
                autoFocus
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: nazareno-sede"
              />
              <p className="text-xs text-muted-foreground">
                É o identificador da sua igreja na plataforma.
              </p>
            </div>
            <Button type="submit" className="w-full rounded-xl gap-2">
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="text-primary underline underline-offset-2">
              Cadastre sua igreja
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
