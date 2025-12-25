import { redirect } from "next/navigation";

/**
 * Raffles index page - redirects to admin dashboard
 * The admin dashboard already displays the raffle list, so this page
 * serves as a redirect to maintain consistent navigation.
 */
export default function RafflesPage() {
  redirect("/admin");
}
