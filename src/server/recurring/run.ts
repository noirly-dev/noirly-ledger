import { dueOccurrences } from "@/src/core/recurrence/next";
import { isoDate } from "@/src/core/budgets/period";
import { withDb } from "@/src/server/db/mongodb";
import { Transaction, WorkspaceMember } from "@/src/server/models";
import { notifyUsers } from "@/src/server/notifications/notify";
import { maybeNotifyBudgetThreshold } from "@/src/server/notifications/budget-threshold";
import type { RecurrenceFrequency } from "@/src/core/models/enums";

function noonUtc(date: Date): Date {
  return new Date(`${isoDate(date)}T12:00:00.000Z`);
}

export async function runRecurringEngine(asOf = new Date()): Promise<{ created: number }> {
  return withDb(async () => {
    const templates = await Transaction.find({
      isRecurring: true,
      recurringParentId: null,
      deletedAt: null,
      recurrence: { $ne: null },
    });

    let created = 0;
    for (const template of templates) {
      const rule = template.recurrence;
      if (!rule) continue;
      const latest = await Transaction.findOne({
        recurringParentId: template._id,
        deletedAt: null,
      }).sort({ date: -1 });
      const lastPosted = latest?.date ?? template.date;
      const due = dueOccurrences(
        lastPosted,
        {
          frequency: rule.frequency as RecurrenceFrequency,
          interval: rule.interval,
          byMonthDay: rule.byMonthDay ?? undefined,
          until: rule.until,
        },
        asOf,
      );

      for (const date of due) {
        const stamp = noonUtc(date);
        const exists = await Transaction.exists({
          recurringParentId: template._id,
          date: stamp,
          deletedAt: null,
        });
        if (exists) continue;

        await Transaction.create({
          workspaceId: template.workspaceId,
          type: template.type,
          amountMinor: template.amountMinor,
          currency: template.currency,
          baseAmountMinor: template.baseAmountMinor,
          categoryId: template.categoryId,
          budgetPoolId: null,
          date: stamp,
          note: template.note,
          isRecurring: false,
          recurrence: null,
          recurringParentId: template._id,
          createdById: template.createdById,
          isPosted: true,
        });
        created += 1;

        if (template.type === "expense" && template.categoryId) {
          await maybeNotifyBudgetThreshold({
            workspaceId: template.workspaceId.toString(),
            categoryId: template.categoryId.toString(),
            addedExpenseMinor: template.baseAmountMinor,
          });
        }
      }

      if (due.length > 0) {
        const members = await WorkspaceMember.find({
          workspaceId: template.workspaceId,
        }).lean();
        await notifyUsers({
          userIds: members.map((m) => m.userId.toString()),
          workspaceId: template.workspaceId.toString(),
          kind: "recurring.due",
          title: "Recurring transaction posted",
          body: `${due.length} occurrence(s) generated from a recurring rule.`,
          href: "/recurring",
        });
      }
    }

    return { created };
  });
}
