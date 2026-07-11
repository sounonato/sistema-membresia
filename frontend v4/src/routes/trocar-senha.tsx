import { createFileRoute } from "@tanstack/react-router";
import { TrocarSenhaPage } from "@/paginas/trocar-senha/page";

export const Route = createFileRoute("/trocar-senha")({
  component: TrocarSenhaPage,
});
