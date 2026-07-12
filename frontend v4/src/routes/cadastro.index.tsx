import { createFileRoute } from "@tanstack/react-router";
import { CadastroIgrejaPage } from "@/paginas/cadastro-igreja/page";

export const Route = createFileRoute("/cadastro/")({
  head: () => ({
    meta: [
      { title: "Cadastrar minha igreja — Ovile" },
      {
        name: "description",
        content:
          "Cadastre sua igreja na plataforma Ovile. Análise em até 48 horas.",
      },
    ],
  }),
  component: CadastroIgrejaPage,
});