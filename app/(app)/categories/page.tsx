import { CategoryManager } from "@/src/features/categories/CategoryManager";
import { requirePersonalWorkspace } from "@/src/server/api/personal";

export default async function CategoriesPage() {
  const { personal } = await requirePersonalWorkspace();
  return <CategoryManager workspaceId={personal.id} />;
}
