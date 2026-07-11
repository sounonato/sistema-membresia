import { createFileRoute } from "@tanstack/react-router";
import { EsqueciSenhaPage } from "@/paginas/esqueci-senha/page";

export const Route = createFileRoute("/esqueci-senha")({
  component: EsqueciSenhaPage,
});
