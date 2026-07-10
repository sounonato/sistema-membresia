import { createFileRoute } from "@tanstack/react-router";
import { NovoConvertidoPage } from "@/paginas/convertidos/novo/page";

export const Route = createFileRoute("/_auth/convertidos/novo")({
  component: NovoConvertidoPage,
});