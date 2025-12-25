import { getCurrentUser } from "@/lib/actions/auth";
import { UserProfile } from "@/components/shared/userProfile";
import { redirect } from "next/navigation";

// Prevent caching of authenticated pages
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, error } = await getCurrentUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b flex items-center justify-between">
        <UserProfile name={user.name} avatarUrl={user.avatar_url} />
        {/* Logout button added in Story 1.4 */}
      </header>
      <main className="flex-1 p-4">{children}</main>
      {/* StatusBar added in Story 3.4 */}
    </div>
  );
}
