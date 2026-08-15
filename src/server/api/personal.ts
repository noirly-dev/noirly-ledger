import { ApiError, getLedgerProvider } from "@/src/server/api/http";

export async function requirePersonalWorkspace() {
  const { ctx, sync } = await getLedgerProvider();
  const workspaces = await sync.listWorkspaces();
  const personal = workspaces.find((workspace) => workspace.kind === "personal");
  if (!personal) {
    throw new ApiError(404, "not_found", "Personal workspace missing");
  }
  return { ctx, sync, personal };
}
