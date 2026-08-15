import { DEFAULT_CATEGORIES } from "@/src/core/categories/defaults";
import { Category } from "@/src/server/models";
import type { Types } from "mongoose";

export async function seedSystemCategories(workspaceId: Types.ObjectId) {
  const existing = await Category.countDocuments({
    workspaceId,
    isSystem: true,
    deletedAt: null,
  });
  if (existing > 0) return;

  await Category.insertMany(
    DEFAULT_CATEGORIES.map((category) => ({
      workspaceId,
      name: category.name,
      icon: category.icon,
      color: category.color,
      isSystem: true,
    })),
  );
}
