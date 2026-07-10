import { createFileRoute } from "@tanstack/react-router";
import { ManualPage } from "@/paginas/manual/page";

export const Route = createFileRoute("/_auth/manual")({
  component: ManualPage,
});