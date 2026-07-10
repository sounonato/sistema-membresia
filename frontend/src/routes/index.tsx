import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/paginas/landing/page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Igreja do Nazareno — Comunidade de fé, discipulado e missão" },
      {
        name: "description",
        content:
          "Conheça a Igreja do Nazareno: cultos, discipulado, comunidade e cuidado pastoral. Faça parte de uma família que vive o Evangelho.",
      },
      { property: "og:title", content: "Igreja do Nazareno" },
      {
        property: "og:description",
        content: "Cultos, discipulado e comunidade. Você é bem-vindo.",
      },
    ],
  }),
  component: LandingPage,
});
