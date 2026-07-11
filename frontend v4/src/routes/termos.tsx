import { createFileRoute } from "@tanstack/react-router";
import { TermosPage } from "@/paginas/termos/page";

export const Route = createFileRoute("/termos")({
  component: TermosPage,
});
