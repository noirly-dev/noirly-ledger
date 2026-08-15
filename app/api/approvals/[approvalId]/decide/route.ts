import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";
import { decideApprovalBodySchema } from "@/src/core/schemas/ledger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ approvalId: string }> },
) {
  try {
    const { approvalId } = await params;
    await assertObjectId(approvalId, "approvalId");
    const body = decideApprovalBodySchema.parse(await request.json());
    const { sync } = await getLedgerProvider();
    const result = await sync.decideApproval({
      approvalId,
      decision: body.decision,
      reviewNote: body.reviewNote ?? null,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
