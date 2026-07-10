import { createFileRoute } from "@tanstack/react-router";
import { ModulosPage } from "@/paginas/modulos/page";

export const Route = createFileRoute("/_auth/modulos")({
  component: ModulosPage,
});