import { getLedgerProvider, jsonError } from "@/src/server/api/http";
import { readReceipt } from "@/src/server/storage/receipts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    await getLedgerProvider();
    const { key } = await params;
    const joined = key.join("/");
    const { bytes, mime } = await readReceipt(joined);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
