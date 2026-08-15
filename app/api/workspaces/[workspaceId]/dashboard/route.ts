import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";
import { dashboardQuerySchema } from "@/src/core/schemas/ledger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const url = new URL(request.url);
    const query = dashboardQuerySchema.parse({
      range: url.searchParams.get("range") ?? "mtd",
    });
    const { sync } = await getLedgerProvider();
    const summary = await sync.getDashboardSummary(workspaceId, query.range);
    return jsonOk({ summary });
  } catch (error) {
    return jsonError(error);
  }
}
