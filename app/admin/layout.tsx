import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";
import { isAdmin } from "@/lib/utils/admin";
import { UserProfile } from "@/components/shared/userProfile";
import { Toaster } from "@/components/ui/sonner";

async function AdminHeader() {
  const { data: user, error } = await getCurrentUser();

  if (error || !user) {
    redirect("/login");
  }

  if (!isAdmin(user.email)) {
    redirect("/participant");
  }

  return (
    <div className="flex items-center justify-between w-full">
      <nav className="flex items-center gap-6">
        <Link
          href="/admin"
          className="text-lg font-semibold text-foreground hover:text-foreground/80"
        >
          Admin Dashboard
        </Link>
        <Link
          href="/admin/raffles"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Raffles
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link
          href="/participant"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Participant View
        </Link>
        <UserProfile name={user.name} avatarUrl={user.avatar_url} />
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between w-full animate-pulse">
      <div className="flex items-center gap-6">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b bg-background">
        <Suspense fallback={<HeaderSkeleton />}>
          <AdminHeader />
        </Suspense>
      </header>
      <main className="flex-1 p-4">{children}</main>
      <Toaster position="top-right" />
    </div>
  );
}
