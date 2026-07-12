import { createFileRoute, redirect } from "@tanstack/react-router";
import { ManualPage } from "@/paginas/manual/page";

export const Route = createFileRoute("/_auth/manual")({
  beforeLoad: ({ context }) => {
    const slug = localStorage.getItem("slug") ?? "";
    if (!slug.includes("nazareno")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: ManualPage,
});
