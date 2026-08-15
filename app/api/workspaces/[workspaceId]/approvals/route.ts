import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const { sync } = await getLedgerProvider();
    const approvals = await sync.listApprovals({
      workspaceId,
      status: status ? [status as "submitted"] : undefined,
    });
    return jsonOk({ approvals });
  } catch (error) {
    return jsonError(error);
  }
}
