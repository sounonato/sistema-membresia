import { createFileRoute } from "@tanstack/react-router";
import { ResetarSenhaPage } from "@/paginas/resetar-senha/page";

export const Route = createFileRoute("/resetar-senha")({
  component: ResetarSenhaPage,
});
