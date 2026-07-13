import { createFileRoute } from "@tanstack/react-router";
import LoginGlobalPage from "@/paginas/login-global/page";

export const Route = createFileRoute("/login")({
  component: LoginGlobalPage,
});
