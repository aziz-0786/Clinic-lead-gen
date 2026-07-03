import { getCurrentBusiness } from "@/lib/business";
import { Sidebar } from "@/components/dashboard/Sidebar";

// Leads/reports/settings read live DB state per request — never prerender
// this subtree statically at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await getCurrentBusiness();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar businessSlug={business?.slug} />
      {/* pt-14 offsets the fixed mobile top bar; md:pt-0 removes it on desktop */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0 min-w-0">{children}</main>
    </div>
  );
}
