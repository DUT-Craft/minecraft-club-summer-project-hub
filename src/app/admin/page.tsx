import { AdminDashboard } from "@/components/admin-dashboard";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-band min-h-screen">
        <div className="wide-shell py-8">
          <AdminDashboard />
        </div>
      </main>
    </>
  );
}
