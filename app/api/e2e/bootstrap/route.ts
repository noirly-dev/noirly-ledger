import { ApiError, jsonError, jsonOk } from "@/src/server/api/http";
import { bootstrapE2e } from "@/src/server/e2e/bootstrap";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const secret = process.env.E2E_SECRET;
    if (!secret) {
      throw new ApiError(404, "not_found", "Not found");
    }
    const header = request.headers.get("authorization") ?? "";
    if (header !== `Bearer ${secret}`) {
      throw new ApiError(401, "unauthorized", "Invalid e2e secret");
    }
    const result = await bootstrapE2e();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
