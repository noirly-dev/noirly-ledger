import { TransactionScreen } from "@/src/features/transactions/TransactionScreen";
import { requirePersonalWorkspace } from "@/src/server/api/personal";

export default async function RecurringPage() {
  const { personal } = await requirePersonalWorkspace();
  return (
    <TransactionScreen
      workspaceId={personal.id}
      baseCurrency={personal.baseCurrency}
      recurringOnly
    />
  );
}
