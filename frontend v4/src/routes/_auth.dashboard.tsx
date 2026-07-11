import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/paginas/dashboard/page";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});