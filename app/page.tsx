import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href="/">Servus Raffle</Link>
            </div>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-8 max-w-5xl p-5 items-center justify-center">
          <h1 className="text-4xl font-bold">Servus Raffle</h1>
          <p className="text-muted-foreground text-center max-w-md">
            A raffle system for Flutter Munich meetups, featuring live draws
            with synchronized wheel animations.
          </p>
          <p className="text-sm text-muted-foreground">
            Coming soon...
          </p>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>Flutter Munich</p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
