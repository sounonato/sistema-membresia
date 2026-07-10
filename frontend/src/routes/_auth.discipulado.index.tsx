import { createFileRoute } from "@tanstack/react-router";
import { DiscipuladoPage } from "@/paginas/discipulado/page";

export const Route = createFileRoute("/_auth/discipulado/")({
  component: DiscipuladoPage,
});