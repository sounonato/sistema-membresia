import { createFileRoute } from "@tanstack/react-router";
import { CadastroPublicoPage } from "@/paginas/cadastro-publico/page";

export const Route = createFileRoute("/cadastro/$slug")({
  component: CadastroPublicoPage,
});