import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/paginas/login/page";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});