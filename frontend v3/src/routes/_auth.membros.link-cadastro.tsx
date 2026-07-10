import { createFileRoute } from "@tanstack/react-router";
import { MembroLinkCadastroPage } from "@/paginas/membros/link-cadastro/page";

export const Route = createFileRoute("/_auth/membros/link-cadastro")({
  component: MembroLinkCadastroPage,
});
