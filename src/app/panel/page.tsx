import { redirect } from "next/navigation";

/** Panel entry — the rooms list is the working surface. */
export default function PanelPage() {
  redirect("/panel/pokoje");
}
