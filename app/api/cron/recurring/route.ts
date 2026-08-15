import { jsonError, jsonOk, ApiError } from "@/src/server/api/http";
import { runRecurringEngine } from "@/src/server/recurring/run";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new ApiError(404, "not_found", "Not found");
    }
    const header = request.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      throw new ApiError(401, "unauthorized", "Invalid cron secret");
    }
    const result = await runRecurringEngine();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
