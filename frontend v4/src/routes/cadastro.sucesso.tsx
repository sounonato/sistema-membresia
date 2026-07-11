import { createFileRoute } from "@tanstack/react-router";
import { CadastroSucessoPage } from "@/paginas/cadastro-igreja/sucesso";

export const Route = createFileRoute("/cadastro/sucesso")({
  head: () => ({
    meta: [
      { title: "Solicitação enviada — Membresia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CadastroSucessoPage,
});