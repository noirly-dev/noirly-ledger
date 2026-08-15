import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";
import { APPROVAL_STATUSES } from "@/src/core/models/enums";

const approvalRequestSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      unique: true,
    },
    budgetPoolId: {
      type: Schema.Types.ObjectId,
      ref: "BudgetPool",
      required: true,
      index: true,
    },
    submittedById: {
      type: Schema.Types.ObjectId,
      ref: "LedgerUser",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: APPROVAL_STATUSES,
      required: true,
      default: "submitted",
      index: true,
    },
    reviewedById: {
      type: Schema.Types.ObjectId,
      ref: "LedgerUser",
      default: null,
    },
    reviewNote: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ApprovalRequestDocument = InferSchemaType<
  typeof approvalRequestSchema
> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ApprovalRequest: Model<ApprovalRequestDocument> =
  (models.ApprovalRequest as Model<ApprovalRequestDocument>) ||
  model<ApprovalRequestDocument>(
    "ApprovalRequest",
    approvalRequestSchema,
    "approval_requests",
  );
