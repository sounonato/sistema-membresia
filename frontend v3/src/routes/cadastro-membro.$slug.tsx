import { createFileRoute } from "@tanstack/react-router";
import { CadastroMembroPublicoPage } from "@/paginas/cadastro-membro/[slug]/page";

export const Route = createFileRoute("/cadastro-membro/$slug")({
  component: CadastroMembroPublicoPage,
});