import { ExpenseList } from "@/src/features/expenses/ExpenseList";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <ExpenseList workspaceId={workspaceId} />;
}
