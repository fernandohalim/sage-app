import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { RecipesProvider } from "@/components/RecipesProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tracking-tight text-ink">
              Sage
            </span>
            <span className="hidden text-xs font-medium text-muted sm:inline">
              scale with intent
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <RecipesProvider>
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
          {children}
        </main>
      </RecipesProvider>

      <BottomNav />
    </div>
  );
}
