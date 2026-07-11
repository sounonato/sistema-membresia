import { createFileRoute } from "@tanstack/react-router";
import { FollowupWhatsappPage } from "@/paginas/followup-whatsapp/page";

export const Route = createFileRoute("/_auth/followup-whatsapp")({
  component: FollowupWhatsappPage,
});