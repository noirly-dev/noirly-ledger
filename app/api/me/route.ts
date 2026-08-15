import { getLedgerProvider, jsonError, jsonOk } from "@/src/server/api/http";

export async function GET() {
  try {
    const { ctx } = await getLedgerProvider();
    return jsonOk({
      user: {
        id: ctx.userId,
        email: ctx.email,
        displayName: ctx.displayName,
        identitySub: ctx.identitySub,
        baseCurrency: ctx.baseCurrency,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
