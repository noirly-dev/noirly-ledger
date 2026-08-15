import {
  ApiError,
  jsonError,
  jsonOk,
  requireLedgerSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { BudgetPool, WorkspaceMember } from "@/src/server/models";
import { signRealtimeJwt } from "@/src/server/realtime/jwt";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    const ctx = await requireLedgerSession();
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");
    if (!workspaceId || !Types.ObjectId.isValid(workspaceId)) {
      throw new ApiError(400, "invalid_request", "workspaceId is required");
    }

    const caps = await withDb(async () => {
      const membership = await WorkspaceMember.findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        userId: new Types.ObjectId(ctx.userId),
      }).lean();
      if (!membership) {
        throw new ApiError(403, "forbidden", "Not a member of this workspace");
      }

      const pools = await BudgetPool.find({
        workspaceId: new Types.ObjectId(workspaceId),
        archivedAt: null,
      })
        .select("_id")
        .lean();

      const next: Record<string, Array<"subscribe" | "publish" | "presence">> = {
        [`workspace:${workspaceId}`]: ["subscribe"],
        [`workspace:${workspaceId}:approvals`]: ["subscribe", "presence"],
        [`user:${ctx.userId}`]: ["subscribe"],
      };
      for (const pool of pools) {
        next[`workspace:${workspaceId}:budgetpool:${pool._id.toString()}`] = [
          "subscribe",
          "presence",
        ];
      }
      return next;
    });

    const { token, expiresIn } = await signRealtimeJwt({
      userId: ctx.userId,
      name: ctx.displayName,
      caps,
    });

    return jsonOk({
      token,
      expiresIn,
      url: process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
