import { ReportBuilder } from "@/src/features/reports/ReportBuilder";

export default async function TeamReportsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <ReportBuilder workspaceId={workspaceId} kind="team" />;
}
