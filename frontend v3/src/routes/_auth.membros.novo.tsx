import { createFileRoute } from "@tanstack/react-router";
import { MembroNovoPage } from "@/paginas/membros/novo/page";

export const Route = createFileRoute("/_auth/membros/novo")({
  component: MembroNovoPage,
});