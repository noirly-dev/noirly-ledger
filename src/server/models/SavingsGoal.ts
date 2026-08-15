import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const savingsGoalSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    targetAmountMinor: { type: Number, required: true },
    currentAmountMinor: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    targetDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type SavingsGoalDocument = InferSchemaType<typeof savingsGoalSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const SavingsGoal: Model<SavingsGoalDocument> =
  (models.SavingsGoal as Model<SavingsGoalDocument>) ||
  model<SavingsGoalDocument>("SavingsGoal", savingsGoalSchema, "savings_goals");
