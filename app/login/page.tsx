"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import { OriginButton } from "@/components/ui/origin-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser, setCurrentUser } from "@/lib/auth";
import { fetchLoginUsers } from "@/lib/users";
import type { AppUser } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingId(null);

    if (getCurrentUser()) {
      router.replace("/");
      return;
    }

    fetchLoginUsers()
      .then((data) => setUsers(data))
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load users from Supabase",
        );
      })
      .finally(() => setLoadingUsers(false));
  }, [router]);

  function handleLogin(user: AppUser) {
    setLoadingId(user.id);
    setError(null);

    try {
      setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email,
      });
      router.replace("/");

      // If route transition does not complete and user remains on /login,
      // recover button state so it never stays stuck at "Signing in...".
      setTimeout(() => {
        if (window.location.pathname === "/login") {
          setLoadingId(null);
        }
      }, 1200);
    } catch (err) {
      setLoadingId(null);
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  }

  const alice = users.find((u) => u.email === "alice@test.com");
  const bob = users.find((u) => u.email === "bob@test.com");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf0 100%)",
      }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white p-10 text-gray-900 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <FileText className="size-9" />
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">
            DocFlow
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your workspace
          </p>
        </div>

        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-semibold tracking-[0.2em] text-gray-400">
            SIGN IN
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex w-full flex-col gap-3.5">
          {loadingUsers ? (
            <>
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </>
          ) : (
            <>
              {alice ? (
                <OriginButton
                  disabled={loadingId !== null}
                  onClick={() => handleLogin(alice)}
                  className="w-full"
                >
                  {loadingId === alice.id ? "Signing in..." : `Login as ${alice.name}`}
                </OriginButton>
              ) : (
                <p className="text-center text-sm text-destructive">
                  Alice not found in Supabase users table
                </p>
              )}
              {bob ? (
                <OriginButton
                  disabled={loadingId !== null}
                  onClick={() => handleLogin(bob)}
                  className="w-full"
                >
                  {loadingId === bob.id ? "Signing in..." : `Login as ${bob.name}`}
                </OriginButton>
              ) : (
                <p className="text-center text-sm text-destructive">
                  Bob not found in Supabase users table
                </p>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="mt-4 w-full rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          Demo workspace
        </p>
      </div>
    </div>
  );
}

