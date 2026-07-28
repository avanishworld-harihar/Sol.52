"use client";

import { useAppSession } from "@/hooks/use-app-session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/** Redirects employees (or signed-out when requireSignedIn) away from admin-only pages. */
export function CompanyAdminOnly({
  children,
  fallbackHref = "/more",
}: {
  children: ReactNode;
  fallbackHref?: string;
}) {
  const router = useRouter();
  const { loading, session } = useAppSession();

  useEffect(() => {
    if (loading) return;
    if (!session?.signedIn || session.gates.orgRole !== "company_admin") {
      router.replace(fallbackHref);
    }
  }, [loading, session, router, fallbackHref]);

  if (loading) {
    return <p className="p-4 text-sm font-semibold text-muted-foreground">Checking access…</p>;
  }

  if (!session?.signedIn || session.gates.orgRole !== "company_admin") {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm font-semibold text-muted-foreground">
          Only the company admin can open this page.
        </p>
        <Link href={fallbackHref} className="text-xs font-bold text-brand-700 underline">
          Back to More
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
