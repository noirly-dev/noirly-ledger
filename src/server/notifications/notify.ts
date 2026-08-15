import { Types } from "mongoose";
import type { NotificationKind } from "@/src/core/sync/types";
import { withDb } from "@/src/server/db/mongodb";
import { LedgerUser, Notification } from "@/src/server/models";
import { sendLedgerEmail } from "@/src/server/mail/send";

export async function notifyUsers(input: {
  userIds: string[];
  workspaceId?: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
}): Promise<void> {
  const unique = [...new Set(input.userIds.filter(Boolean))];
  if (unique.length === 0) return;

  await withDb(async () => {
    const emailRequested = Boolean(process.env.SMTP_URL);
    await Notification.insertMany(
      unique.map((userId) => ({
        userId: new Types.ObjectId(userId),
        workspaceId: input.workspaceId
          ? new Types.ObjectId(input.workspaceId)
          : null,
        kind: input.kind,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        emailRequested,
        createdAt: new Date(),
      })),
    );

    if (!emailRequested) return;
    const users = await LedgerUser.find({
      _id: { $in: unique.map((id) => new Types.ObjectId(id)) },
    }).lean();
    await Promise.all(
      users.map((user) =>
        user.email
          ? sendLedgerEmail({
              to: user.email,
              subject: input.title,
              text: `${input.body}\n${input.href ?? ""}`.trim(),
            })
          : Promise.resolve(false),
      ),
    );
  });
}
