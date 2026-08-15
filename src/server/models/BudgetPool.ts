import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const budgetPoolSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    limitAmountMinor: { type: Number, required: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    currentSpendMinor: { type: Number, required: true, default: 0 },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type BudgetPoolDocument = InferSchemaType<typeof budgetPoolSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BudgetPool: Model<BudgetPoolDocument> =
  (models.BudgetPool as Model<BudgetPoolDocument>) ||
  model<BudgetPoolDocument>("BudgetPool", budgetPoolSchema, "budget_pools");
