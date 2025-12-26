import Link from "next/link";
import { getRafflesWithWinnerCount, type RaffleWithWinnerCount } from "@/lib/actions/raffles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, PlusCircle, Trophy } from "lucide-react";
import { formatDate, getStatusVariant } from "@/lib/utils/raffle";

/**
 * Raffle list item component
 * Story 6.7: Added winner count display for completed raffles
 */
function RaffleListItem({ raffle }: { raffle: RaffleWithWinnerCount }) {
  return (
    <Link href={`/admin/raffles/${raffle.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{raffle.name}</CardTitle>
              <Badge variant={getStatusVariant(raffle.status)}>
                {raffle.status}
              </Badge>
              {/* Story 6.7 AC #6: Winner count badge for completed raffles */}
              {raffle.status === "completed" && raffle.winner_count > 0 && (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-600"
                  data-testid="winner-count-badge"
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  {raffle.winner_count} {raffle.winner_count === 1 ? "Winner" : "Winners"}
                </Badge>
              )}
            </div>
            <CardDescription>{formatDate(raffle.created_at)}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

/**
 * Empty state when no raffles exist
 */
function EmptyRaffleState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <p className="text-muted-foreground mb-4">
          No raffles yet. Create your first raffle to get started.
        </p>
        <Link href="/admin/raffles/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Raffle
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  const { data: raffles, error } = await getRafflesWithWinnerCount();

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage raffles and view event history
          </p>
        </div>
        <Link href="/admin/raffles/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Raffle
          </Button>
        </Link>
      </div>

      {/* Raffle List Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Raffles</h2>
        {error ? (
          <Card className="bg-destructive/10">
            <CardContent className="py-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : !raffles || raffles.length === 0 ? (
          <EmptyRaffleState />
        ) : (
          <div className="space-y-3">
            {raffles.map((raffle) => (
              <RaffleListItem key={raffle.id} raffle={raffle} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Stats Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Raffles</CardDescription>
              <CardTitle className="text-3xl">{raffles?.length ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Raffles</CardDescription>
              <CardTitle className="text-3xl">
                {raffles?.filter((r) => r.status === "active").length ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed Raffles</CardDescription>
              <CardTitle className="text-3xl">
                {raffles?.filter((r) => r.status === "completed").length ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* View History Link */}
      <section className="mt-8">
        <Link href="/admin/history">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="py-4">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">View Raffle History</CardTitle>
              </div>
              <CardDescription>
                See past raffles, winners, and fairness statistics
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>
    </div>
  );
}
