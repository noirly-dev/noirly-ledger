import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const { notificationId } = await params;
    await assertObjectId(notificationId, "notificationId");
    const { sync } = await getLedgerProvider();
    await sync.markNotificationRead(notificationId);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
