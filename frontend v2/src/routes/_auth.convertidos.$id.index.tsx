import { createFileRoute } from "@tanstack/react-router";
import { ConvertidoDetalhePage } from "@/paginas/convertidos/[id]/page";

export const Route = createFileRoute("/_auth/convertidos/$id/")({
  component: ConvertidoDetalhePage,
});