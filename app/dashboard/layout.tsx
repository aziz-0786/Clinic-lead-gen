import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/* pt-14 offsets the fixed mobile top bar; md:pt-0 removes it on desktop */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0 min-w-0">{children}</main>
    </div>
  );
}
