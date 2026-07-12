import { createFileRoute } from "@tanstack/react-router";
import { RelatoriosPage } from "@/paginas/relatorios/page";
import { z } from "zod";

const relatoriosSearchSchema = z.object({
  tab: z.string().optional(),
});

export const Route = createFileRoute("/_auth/relatorios")({
  validateSearch: (search) => relatoriosSearchSchema.parse(search),
  component: RelatoriosPage,
});