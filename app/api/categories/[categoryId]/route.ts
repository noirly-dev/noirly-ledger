import { getLedgerProvider, jsonError, jsonOk, assertObjectId } from "@/src/server/api/http";
import { updateCategoryBodySchema } from "@/src/core/schemas/ledger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const { categoryId } = await params;
    await assertObjectId(categoryId, "categoryId");
    const body = updateCategoryBodySchema.parse(await request.json());
    const { sync } = await getLedgerProvider();
    const category = await sync.updateCategory(categoryId, body);
    return jsonOk({ category });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  try {
    const { categoryId } = await params;
    await assertObjectId(categoryId, "categoryId");
    const { sync } = await getLedgerProvider();
    await sync.archiveCategory(categoryId);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
