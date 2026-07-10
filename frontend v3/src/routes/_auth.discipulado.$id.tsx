import { createFileRoute } from "@tanstack/react-router";
import { GrupoDetalhePage } from "@/paginas/discipulado/[id]/page";

export const Route = createFileRoute("/_auth/discipulado/$id")({
  component: GrupoDetalhePage,
});