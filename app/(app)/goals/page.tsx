import { GoalsScreen } from "@/src/features/savings-goals/GoalsScreen";
import { requirePersonalWorkspace } from "@/src/server/api/personal";

export default async function GoalsPage() {
  const { personal } = await requirePersonalWorkspace();
  return (
    <GoalsScreen workspaceId={personal.id} baseCurrency={personal.baseCurrency} />
  );
}
