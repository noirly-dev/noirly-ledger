import { getLedgerProvider, jsonError, jsonOk } from "@/src/server/api/http";

export async function GET() {
  try {
    const { sync } = await getLedgerProvider();
    const notifications = await sync.listNotifications();
    return jsonOk({ notifications });
  } catch (error) {
    return jsonError(error);
  }
}
