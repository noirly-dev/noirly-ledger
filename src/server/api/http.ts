import { cache } from "react";
import { Types } from "mongoose";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { ensureLedgerAccount } from "@/src/server/auth/bootstrap";
import { createMongoLedgerProvider } from "@/src/server/providers/mongo-ledger-provider";

export type LedgerSessionContext = {
  identitySub: string;
  userId: string;
  email: string;
  displayName: string;
  baseCurrency: string;
};

export type PersonalWorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  kind: "personal";
  baseCurrency: string;
};

/**
 * One Mongo bootstrap + provider per request. Layout, pages, and nested
 * workspace layouts all share this — without it every sidebar hop upserted
 * the user twice and listed workspaces twice before painting.
 */
export const getLedgerProvider = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "unauthorized", "Sign in required");
  }

  const account = await ensureLedgerAccount({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const ctx: LedgerSessionContext = {
    identitySub: account.user.identitySub,
    userId: account.user.id,
    email: account.user.email,
    displayName: account.user.displayName,
    baseCurrency: account.user.baseCurrency,
  };

  return {
    ctx,
    sync: createMongoLedgerProvider({ userId: ctx.userId }),
    personal: account.personalWorkspace as PersonalWorkspaceSummary,
  };
});

export const requireLedgerSession = cache(async (): Promise<LedgerSessionContext> => {
  const { ctx } = await getLedgerProvider();
  return ctx;
});

/** Sidebar workspace list — also request-cached so layout is the only caller that pays. */
export const listSessionWorkspaces = cache(async () => {
  const { sync } = await getLedgerProvider();
  return sync.listWorkspaces();
});

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: "invalid_request", message: error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }
  console.error(error);
  return Response.json(
    { error: "internal_error", message: "Something went wrong" },
    { status: 500 },
  );
}

export async function assertObjectId(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "invalid_request", `Invalid ${label}`);
  }
}
