import { withDb } from "@/src/server/db/mongodb";
import { seedSystemCategories } from "@/src/server/categories/seed";
import {
  LedgerUser,
  Workspace,
  WorkspaceMember,
  type LedgerUserDocument,
  type WorkspaceDocument,
} from "@/src/server/models";

export type BootstrapSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type BootstrappedAccount = {
  user: {
    id: string;
    identitySub: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    baseCurrency: string;
  };
  personalWorkspace: {
    id: string;
    name: string;
    slug: string;
    kind: "personal";
    baseCurrency: string;
  };
};

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

async function ensurePersonalWorkspace(
  user: LedgerUserDocument,
): Promise<WorkspaceDocument> {
  const existingMembership = await WorkspaceMember.findOne({
    userId: user._id,
    role: "owner",
  }).lean();

  if (existingMembership) {
    const workspace = await Workspace.findOne({
      _id: existingMembership.workspaceId,
      kind: "personal",
    });
    if (workspace) {
      // Categories are seeded at create time. Do not count/seed on every nav hop.
      return workspace;
    }
  }

  const slugBase = slugify(`${user.displayName}-personal`);
  let slug = slugBase;
  let n = 0;
  while (await Workspace.exists({ slug })) {
    n += 1;
    slug = `${slugBase}-${n}`;
  }

  const workspace = await Workspace.create({
    kind: "personal",
    name: "Personal",
    slug,
    ownerUserId: user._id,
    baseCurrency: user.baseCurrency || "USD",
  });

  await WorkspaceMember.create({
    workspaceId: workspace._id,
    userId: user._id,
    role: "owner",
  });

  await seedSystemCategories(workspace._id);
  return workspace;
}

/**
 * Resolve the Ledger user + personal workspace for an Identity session.
 *
 * Hot path is read-only: find the user, reuse the personal workspace, return.
 * Writes only when the account is missing or profile fields actually changed.
 */
export async function ensureLedgerAccount(
  sessionUser: BootstrapSessionUser,
): Promise<BootstrappedAccount> {
  if (!sessionUser.id) {
    throw new Error("Session is missing Identity subject (sub)");
  }

  return withDb(async () => {
    const email =
      sessionUser.email?.trim().toLowerCase() || `${sessionUser.id}@users.local`;
    const displayName =
      sessionUser.name?.trim() || email.split("@")[0] || "Noirly user";
    const avatarUrl = sessionUser.image ?? null;
    const emailVerified = Boolean(sessionUser.email);

    let user = await LedgerUser.findOne({ identitySub: sessionUser.id });

    if (!user) {
      user = await LedgerUser.create({
        identitySub: sessionUser.id,
        email,
        displayName,
        avatarUrl,
        emailVerified,
        baseCurrency: "USD",
        locale: "en-US",
      });
    } else {
      const needsUpdate =
        user.email !== email ||
        user.displayName !== displayName ||
        (user.avatarUrl ?? null) !== avatarUrl ||
        user.emailVerified !== emailVerified;

      if (needsUpdate) {
        user.email = email;
        user.displayName = displayName;
        user.avatarUrl = avatarUrl;
        user.emailVerified = emailVerified;
        await user.save();
      }
    }

    const workspace = await ensurePersonalWorkspace(user);

    return {
      user: {
        id: user._id.toString(),
        identitySub: user.identitySub,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        baseCurrency: user.baseCurrency,
      },
      personalWorkspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        kind: "personal",
        baseCurrency: workspace.baseCurrency,
      },
    };
  });
}
