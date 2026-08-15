import { getLedgerProvider, jsonError, jsonOk } from "@/src/server/api/http";
import { acceptInvite } from "@/src/server/workspace/members";
import { z } from "zod";

const bodySchema = z.object({ token: z.string().min(8) });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const { ctx } = await getLedgerProvider();
    const result = await acceptInvite(ctx.userId, body.token);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
