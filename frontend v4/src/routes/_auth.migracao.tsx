import { createFileRoute } from "@tanstack/react-router";
import { MigracaoPage } from "@/paginas/migracao/page";

export const Route = createFileRoute("/_auth/migracao")({
  component: MigracaoPage,
});
