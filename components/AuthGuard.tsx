"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset } from "@/components/ui/sidebar";

function AuthLoading() {
  return (
    <div className="flex min-h-svh w-full">
      <div className="hidden w-64 shrink-0 border-r bg-sidebar md:block" />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <Skeleton className="size-7" />
          <Skeleton className="h-6 w-48" />
        </header>
        <main className="flex flex-1 items-center justify-center p-8">
          <Skeleton className="h-8 w-64" />
        </main>
      </SidebarInset>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <AuthLoading />;

  return <>{children}</>;
}
