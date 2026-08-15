import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ poolId: string }> },
) {
  try {
    const { poolId } = await params;
    await assertObjectId(poolId, "poolId");
    const { sync } = await getLedgerProvider();
    const pool = await sync.getBudgetPool(poolId);
    return jsonOk({ pool });
  } catch (error) {
    return jsonError(error);
  }
}
