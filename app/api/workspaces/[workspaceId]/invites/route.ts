import {
  assertObjectId,
  getLedgerProvider,
  jsonError,
  jsonOk,
} from "@/src/server/api/http";
import { createInviteBodySchema } from "@/src/core/schemas/ledger";
import { createInvite } from "@/src/server/workspace/members";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    const body = createInviteBodySchema.parse(await request.json());
    const { ctx } = await getLedgerProvider();
    const invite = await createInvite({
      workspaceId,
      userId: ctx.userId,
      role: body.role,
    });
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.AUTH_URL ??
      "http://localhost:3003";
    return jsonOk({
      invite: {
        ...invite,
        url: `${origin.replace(/\/$/, "")}/invite/${invite.token}`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
