import { can } from "@/src/core/permissions/can";
import { MembersPanel } from "@/src/features/workspace/MembersPanel";
import { getLedgerProvider } from "@/src/server/api/http";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { ctx, sync } = await getLedgerProvider();
  const workspace = await sync.getWorkspace(workspaceId);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Roles: owner, approver, member. Members can submit; approvers decide.
      </p>
      <div className="mt-6">
        <MembersPanel
          workspaceId={workspaceId}
          currentUserId={ctx.userId}
          canManage={can(workspace.role, "members.manage")}
        />
      </div>
    </main>
  );
}
