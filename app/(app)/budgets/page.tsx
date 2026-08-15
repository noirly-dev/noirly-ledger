import { BudgetScreen } from "@/src/features/budgets/BudgetScreen";
import { requirePersonalWorkspace } from "@/src/server/api/personal";

export default async function BudgetsPage() {
  const { personal } = await requirePersonalWorkspace();
  return (
    <BudgetScreen workspaceId={personal.id} baseCurrency={personal.baseCurrency} />
  );
}
