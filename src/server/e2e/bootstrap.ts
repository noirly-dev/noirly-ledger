import { encode } from "next-auth/jwt";
import { ensureLedgerAccount } from "@/src/server/auth/bootstrap";
import { withDb } from "@/src/server/db/mongodb";
import { BudgetPool, FxRate, WorkspaceMember } from "@/src/server/models";
import { parseRateToScaled } from "@/src/core/money";
import { Types } from "mongoose";
import { isoDate } from "@/src/core/budgets/period";

const COOKIE = "authjs.session-token";

async function sessionToken(input: {
  identitySub: string;
  email: string;
  name: string;
}) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return encode({
    salt: COOKIE,
    secret,
    token: {
      sub: input.identitySub,
      identitySub: input.identitySub,
      email: input.email,
      name: input.name,
    },
  });
}

export async function bootstrapE2e() {
  const run = Date.now().toString(36);
  const ownerSub = `e2e-owner-${run}`;
  const memberSub = `e2e-member-${run}`;
  const owner = await ensureLedgerAccount({
    id: ownerSub,
    email: `owner-${run}@noirly.test`,
    name: "E2E Owner",
  });
  const member = await ensureLedgerAccount({
    id: memberSub,
    email: `member-${run}@noirly.test`,
    name: "E2E Member",
  });

  const team = await withDb(async () => {
    const { createMongoLedgerProvider } = await import(
      "@/src/server/providers/mongo-ledger-provider"
    );
    const sync = createMongoLedgerProvider({ userId: owner.user.id });
    const workspace = await sync.createWorkspace({
      name: `E2E Team ${run}`,
      kind: "team",
      baseCurrency: "USD",
    });
    await WorkspaceMember.create({
      workspaceId: new Types.ObjectId(workspace.id),
      userId: new Types.ObjectId(member.user.id),
      role: "member",
    });
    const pool = await BudgetPool.create({
      workspaceId: new Types.ObjectId(workspace.id),
      name: "Ops",
      description: "E2E pool",
      limitAmountMinor: 500_000,
      currency: "USD",
      currentSpendMinor: 0,
    });
    await FxRate.create({
      workspaceId: new Types.ObjectId(owner.personalWorkspace.id),
      currency: "EUR",
      rateToBaseScaled: parseRateToScaled("1.10"),
      effectiveFrom: new Date(`${isoDate(new Date())}T00:00:00.000Z`),
      createdById: new Types.ObjectId(owner.user.id),
    });
    return { workspace, poolId: pool._id.toString() };
  });

  const [ownerToken, memberToken] = await Promise.all([
    sessionToken({
      identitySub: ownerSub,
      email: owner.user.email,
      name: owner.user.displayName,
    }),
    sessionToken({
      identitySub: memberSub,
      email: member.user.email,
      name: member.user.displayName,
    }),
  ]);

  return {
    cookieName: COOKIE,
    ownerToken,
    memberToken,
    teamWorkspaceId: team.workspace.id,
    poolId: team.poolId,
    personalWorkspaceId: owner.personalWorkspace.id,
  };
}
