import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";
import { saveReceipt } from "@/src/server/storage/receipts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    await assertObjectId(workspaceId, "workspaceId");
    await getLedgerProvider();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError(new Error("file is required"));
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveReceipt({
      workspaceId,
      bytes,
      mime: file.type || "image/jpeg",
    });
    return jsonOk(saved, 201);
  } catch (error) {
    return jsonError(error);
  }
}
