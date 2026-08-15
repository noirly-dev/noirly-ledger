import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";
import { upsertGoalBodySchema } from "@/src/core/schemas/ledger";
import { parseMajorToMinor } from "@/src/core/money";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const { sync } = await getLedgerProvider();
    const goals = await sync.listSavingsGoals(workspaceId);
    return jsonOk({ goals });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const body = upsertGoalBodySchema.parse(await request.json());
    const { sync } = await getLedgerProvider();
    const goal = await sync.upsertSavingsGoal({
      workspaceId,
      name: body.name,
      targetAmountMinor: parseMajorToMinor(body.targetMajor),
      currentAmountMinor: body.currentMajor
        ? parseMajorToMinor(body.currentMajor)
        : 0,
      currency: body.currency,
      targetDate: body.targetDate ?? null,
    });
    return jsonOk({ goal }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
