import { createFileRoute } from "@tanstack/react-router";
import { MinisteriosPage } from "@/paginas/ministerios/page";

export const Route = createFileRoute("/_auth/ministerios")({
  component: MinisteriosPage,
});