import { createFileRoute } from "@tanstack/react-router";
import { EditarConvertidoPage } from "@/paginas/convertidos/[id]/editar/page";

export const Route = createFileRoute("/_auth/convertidos/$id/editar")({
  component: EditarConvertidoPage,
});