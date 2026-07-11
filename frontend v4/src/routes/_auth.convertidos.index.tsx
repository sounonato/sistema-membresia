import { createFileRoute } from "@tanstack/react-router";
import { ConvertidosPage } from "@/paginas/convertidos/page";

export const Route = createFileRoute("/_auth/convertidos/")({
  component: ConvertidosPage,
});