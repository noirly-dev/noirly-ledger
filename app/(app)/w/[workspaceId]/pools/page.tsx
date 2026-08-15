import { PoolList } from "@/src/features/pools/PoolList";
import { getLedgerProvider } from "@/src/server/api/http";

export default async function PoolsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { sync } = await getLedgerProvider();
  const workspace = await sync.getWorkspace(workspaceId);
  return (
    <PoolList workspaceId={workspaceId} baseCurrency={workspace.baseCurrency} />
  );
}
