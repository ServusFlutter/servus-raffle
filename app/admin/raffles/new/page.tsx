import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RaffleForm } from "@/components/admin/raffleForm";

/**
 * Page for creating a new raffle
 * Displays the raffle creation form with navigation back to dashboard
 */
export default function CreateRafflePage() {
  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <RaffleForm />
    </div>
  );
}
