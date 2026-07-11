import { createFileRoute } from "@tanstack/react-router";
import { UsuariosPage } from "@/paginas/usuarios/page";

export const Route = createFileRoute("/_auth/usuarios")({
  component: UsuariosPage,
});