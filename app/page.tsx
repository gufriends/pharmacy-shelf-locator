"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useActiveOrganization } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending: isSessionLoading } = useSession();
  const { data: activeOrg, isPending: isActiveOrgLoading } = useActiveOrganization();
  const router = useRouter();

  useEffect(() => {
    if (!isSessionLoading && !isActiveOrgLoading) {
      if (!session) {
        router.push("/login");
      } else if (!activeOrg) {
        router.push("/pharmacy");
      } else {
        router.push("/overview");
      }
    }
  }, [session, activeOrg, isSessionLoading, isActiveOrgLoading, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-teal-500 rounded-2xl animate-bounce flex items-center justify-center text-white">
          <iconify-icon icon="solar:pill-bold" width="32" height="32"></iconify-icon>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <p className="text-xs text-slate-500 font-medium">Rivpharma Engine Loading...</p>
        </div>
      </div>
    </div>
  );
}
