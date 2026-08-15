import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";
import { removeMember } from "@/src/server/workspace/members";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
  try {
    const { workspaceId, userId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    await assertObjectId(userId, "userId");
    const { ctx } = await getLedgerProvider();
    await removeMember({ actorId: ctx.userId, workspaceId, targetUserId: userId });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
