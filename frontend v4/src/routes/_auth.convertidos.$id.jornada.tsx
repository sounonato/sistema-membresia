import { createFileRoute } from "@tanstack/react-router";
import { JornadaPage } from "@/paginas/jornada/page";

export const Route = createFileRoute("/_auth/convertidos/$id/jornada")({
  component: JornadaPage,
});