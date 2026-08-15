import { PoolDetail } from "@/src/features/pools/PoolDetail";

export default async function PoolDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string; poolId: string }>;
}) {
  const { workspaceId, poolId } = await params;
  return <PoolDetail workspaceId={workspaceId} poolId={poolId} />;
}
