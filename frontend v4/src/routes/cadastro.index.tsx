import { createFileRoute } from "@tanstack/react-router";
import { CadastroIgrejaPage } from "@/paginas/cadastro-igreja/page";

export const Route = createFileRoute("/cadastro/")({
  head: () => ({
    meta: [
      { title: "Cadastrar minha igreja — Membresia" },
      {
        name: "description",
        content:
          "Cadastre sua igreja no sistema Membresia. Análise em até 48 horas.",
      },
    ],
  }),
  component: CadastroIgrejaPage,
});