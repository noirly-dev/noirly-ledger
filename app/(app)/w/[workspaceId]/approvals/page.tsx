import { ApprovalsInbox } from "@/src/features/approvals/ApprovalsInbox";

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <ApprovalsInbox workspaceId={workspaceId} />;
}
