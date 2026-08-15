import { ExpenseSubmitForm } from "@/src/features/expenses/ExpenseSubmitForm";
import { getLedgerProvider } from "@/src/server/api/http";

export default async function NewExpensePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ poolId?: string }>;
}) {
  const { workspaceId } = await params;
  const { poolId } = await searchParams;
  const { sync } = await getLedgerProvider();
  const workspace = await sync.getWorkspace(workspaceId);
  return (
    <ExpenseSubmitForm
      workspaceId={workspaceId}
      baseCurrency={workspace.baseCurrency}
      defaultPoolId={poolId}
    />
  );
}
