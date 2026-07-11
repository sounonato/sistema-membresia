import { createFileRoute } from "@tanstack/react-router";
import { MembroDetalhe } from "@/paginas/membros/[id]/page";

export const Route = createFileRoute("/_auth/membros/$id/")({
  component: MembroDetalhe,
});