import { createFileRoute } from "@tanstack/react-router";
import { IgrejasPage } from "@/paginas/igrejas/page";

export const Route = createFileRoute("/_auth/igrejas")({
  component: IgrejasPage,
});