import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExchangeRequests } from "@/app/requests/actions";
import { RequestsExplorer } from "@/components/requests/RequestsExplorer";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/requests");
  }

  const initialData = await getExchangeRequests();

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <RequestsExplorer initialData={initialData} currentUserId={user.id} />
      </div>
    </div>
  );
}
