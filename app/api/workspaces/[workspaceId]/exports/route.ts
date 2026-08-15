import {
  ApiError,
  assertObjectId,
  getLedgerProvider,
  jsonError,
} from "@/src/server/api/http";
import { exportBodySchema } from "@/src/core/schemas/ledger";
import { requireAction } from "@/src/server/workspace/members";
import { buildCsvExport, buildPdfExport } from "@/src/server/exports/build";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const body = exportBodySchema.parse(await request.json());
    if (body.from > body.to) {
      throw new ApiError(400, "invalid_request", "from must be on or before to");
    }
    if (body.template === "pool" && !body.budgetPoolId) {
      throw new ApiError(400, "invalid_request", "budgetPoolId is required for pool reports");
    }
    const { ctx, sync } = await getLedgerProvider();
    await requireAction(ctx.userId, workspaceId, "report.export");
    const workspace = await sync.getWorkspace(workspaceId);
    const query = {
      workspaceId,
      from: body.from,
      to: body.to,
      budgetPoolId: body.budgetPoolId ?? null,
      template: body.template,
    };
    const stamp = `${body.from}_${body.to}`;
    if (body.format === "csv") {
      const csv = await buildCsvExport(query);
      return new Response(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="ledger-${stamp}.csv"`,
        },
      });
    }
    const pdf = await buildPdfExport(query, workspace.name, workspace.baseCurrency);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="ledger-${stamp}.pdf"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
