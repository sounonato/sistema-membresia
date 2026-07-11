import { createFileRoute } from "@tanstack/react-router";
import { LandingSaasPage } from "@/paginas/landing-saas/page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Membresia — Sistema de gestão para igrejas" },
      {
        name: "description",
        content:
          "Sistema completo de membros, discipulado e ministérios para igrejas evangélicas. Cuide das pessoas, não das planilhas.",
      },
      { property: "og:title", content: "Membresia — Sistema para igrejas" },
      {
        property: "og:description",
        content:
          "Membros, discipulado e ministérios em um só lugar. Grátis para começar.",
      },
    ],
  }),
  component: LandingSaasPage,
});
