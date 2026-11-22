import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getPendingIncomingCount } from "@/app/requests/actions";
import { AppShell } from "./AppShell";

export async function ServerAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  let profile = null;
  let pendingCount = 0;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    user = authUser;

    if (user) {
      const [{ data }, pendingCountResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, username, avatar_url")
          .eq("id", user.id)
          .single(),
        getPendingIncomingCount(),
      ]);
      profile = data;
      pendingCount = pendingCountResult;
    }
  } catch (error: any) {
    // Gracefully handle dynamic server usage during static page export
    if (error?.digest !== "DYNAMIC_SERVER_USAGE") {
      console.warn("ServerAppShell session read warning:", error);
    }
  }

  return (
    <AppShell
      user={user ? { id: user.id, email: user.email } : null}
      profile={profile}
      initialPendingCount={pendingCount}
    >
      {children}
    </AppShell>
  );
}
