import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const categorySchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    isSystem: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

categorySchema.index({ workspaceId: 1, name: 1 });

export type CategoryDocument = InferSchemaType<typeof categorySchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Category: Model<CategoryDocument> =
  (models.Category as Model<CategoryDocument>) ||
  model<CategoryDocument>("Category", categorySchema, "categories");
