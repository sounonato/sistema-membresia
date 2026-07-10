import { createFileRoute } from "@tanstack/react-router";
import { DiscipuladoresPage } from "@/paginas/discipuladores/page";

export const Route = createFileRoute("/_auth/discipuladores")({
  component: DiscipuladoresPage,
});