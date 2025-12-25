import { Suspense } from "react";
import { getCurrentUser } from "@/lib/actions/auth";
import { UserProfile } from "@/components/shared/userProfile";
import { redirect } from "next/navigation";

async function AuthenticatedHeader() {
  const { data: user, error } = await getCurrentUser();

  if (error || !user) {
    redirect("/login");
  }

  return <UserProfile name={user.name} avatarUrl={user.avatar_url} />;
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 bg-muted rounded-full" />
      <div className="h-4 w-24 bg-muted rounded" />
    </div>
  );
}

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b flex items-center justify-between">
        <Suspense fallback={<HeaderSkeleton />}>
          <AuthenticatedHeader />
        </Suspense>
        {/* Logout button added in Story 1.4 */}
      </header>
      <main className="flex-1 p-4">{children}</main>
      {/* StatusBar added in Story 3.4 */}
    </div>
  );
}
