import { createFileRoute } from "@tanstack/react-router";
import { QrCadastroPage } from "@/paginas/qr-cadastro/page";

export const Route = createFileRoute("/_auth/qr-cadastro")({
  component: QrCadastroPage,
});