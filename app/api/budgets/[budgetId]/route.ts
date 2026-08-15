import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ budgetId: string }> },
) {
  try {
    const { budgetId } = await params;
    await assertObjectId(budgetId, "budgetId");
    const { sync } = await getLedgerProvider();
    await sync.deleteBudget(budgetId);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
