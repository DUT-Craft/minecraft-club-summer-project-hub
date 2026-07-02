import { notFound } from "next/navigation";

import { ProjectOwnerDashboard } from "@/components/project-owner-dashboard";
import { SiteHeader } from "@/components/site-header";
import { getRecord } from "@/lib/storage";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getRecord<Project>("projects", id);

  if (!project || project.reviewStatus !== "approved") {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="page-band min-h-screen">
        <div className="wide-shell py-8">
          <ProjectOwnerDashboard projectId={project.id} />
        </div>
      </main>
    </>
  );
}
