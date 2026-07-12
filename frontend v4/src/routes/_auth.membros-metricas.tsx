import { createFileRoute } from "@tanstack/react-router";
import { MembrosMetricasPage } from "@/paginas/membros-metricas/page";

export const Route = createFileRoute("/_auth/membros-metricas")({
  component: MembrosMetricasPage,
});
