import { createFileRoute } from "@tanstack/react-router";
import { MembrosPage } from "@/paginas/membros/page";

export const Route = createFileRoute("/_auth/membros/")({
  component: MembrosPage,
});