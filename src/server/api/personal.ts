import { cache } from "react";
import { ApiError, getLedgerProvider } from "@/src/server/api/http";

/**
 * Personal pages only need id + baseCurrency. Pull them from the cached
 * bootstrap instead of listing every workspace again.
 */
export const requirePersonalWorkspace = cache(async () => {
  const { ctx, sync, personal } = await getLedgerProvider();
  if (!personal) {
    throw new ApiError(404, "not_found", "Personal workspace missing");
  }
  return { ctx, sync, personal };
});
