import { createFileRoute } from "@tanstack/react-router";
import { MembroEditarPage } from "@/paginas/membros/[id]/editar/page";

export const Route = createFileRoute("/_auth/membros/$id/editar")({
  component: MembroEditarPage,
});