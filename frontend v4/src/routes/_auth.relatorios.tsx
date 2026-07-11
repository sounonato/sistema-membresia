import { createFileRoute } from "@tanstack/react-router";
import { RelatoriosPage } from "@/paginas/relatorios/page";

export const Route = createFileRoute("/_auth/relatorios")({
  component: RelatoriosPage,
});