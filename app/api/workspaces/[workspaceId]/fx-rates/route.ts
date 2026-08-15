import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";
import { upsertFxRateBodySchema } from "@/src/core/schemas/ledger";
import { parseRateToScaled } from "@/src/core/money";
import { isoDate } from "@/src/core/budgets/period";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const { sync } = await getLedgerProvider();
    const rates = await sync.listFxRates(workspaceId);
    return jsonOk({ rates });
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
    const body = upsertFxRateBodySchema.parse(await request.json());
    const { sync } = await getLedgerProvider();
    const rate = await sync.upsertFxRate({
      workspaceId,
      currency: body.currency,
      rateToBaseScaled: parseRateToScaled(body.rate),
      effectiveFrom: body.effectiveFrom ?? isoDate(new Date()),
    });
    return jsonOk({ rate });
  } catch (error) {
    return jsonError(error);
  }
}
