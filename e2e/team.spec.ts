import { test, expect, type Browser, request as playwrightRequest } from "@playwright/test";

const secret = process.env.E2E_SECRET ?? "";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3003";

test.describe("team permissions and FX", () => {
  test.skip(!secret, "Set E2E_SECRET to run authenticated specs");

  let cookieName = "authjs.session-token";
  let ownerToken = "";
  let memberToken = "";
  let teamWorkspaceId = "";
  let poolId = "";

  test.beforeAll(async () => {
    const api = await playwrightRequest.newContext({ baseURL });
    const res = await api.post("/api/e2e/bootstrap", {
      headers: { authorization: `Bearer ${secret}` },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const body = (await res.json()) as {
      cookieName: string;
      ownerToken: string;
      memberToken: string;
      teamWorkspaceId: string;
      poolId: string;
    };
    cookieName = body.cookieName;
    ownerToken = body.ownerToken;
    memberToken = body.memberToken;
    teamWorkspaceId = body.teamWorkspaceId;
    poolId = body.poolId;
    await api.dispose();
  });

  async function asUser(browser: Browser, token: string) {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: cookieName,
        value: token,
        url: "http://localhost:3003",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    return context;
  }

  test("members cannot approve and owners can", async ({ browser, request }) => {
    const memberCtx = await asUser(browser, memberToken);
    const memberPage = await memberCtx.newPage();
    await memberPage.goto(`/w/${teamWorkspaceId}`);
    await expect(memberPage.getByText("TEAM · MEMBER")).toBeVisible();
    await expect(memberPage.getByRole("link", { name: "Approvals" })).toHaveCount(0);

    const submit = await request.post(
      `/api/workspaces/${teamWorkspaceId}/expenses`,
      {
        headers: {
          cookie: `${cookieName}=${memberToken}`,
          "content-type": "application/json",
        },
        data: {
          budgetPoolId: poolId,
          amountMajor: "12.00",
          currency: "USD",
          date: new Date().toISOString().slice(0, 10),
          note: "E2E taxi",
        },
      },
    );
    expect(submit.ok(), await submit.text()).toBeTruthy();
    const submitted = (await submit.json()) as { approval: { id: string } };

    const forbidden = await request.post(
      `/api/approvals/${submitted.approval.id}/decide`,
      {
        headers: {
          cookie: `${cookieName}=${memberToken}`,
          "content-type": "application/json",
        },
        data: { decision: "approved" },
      },
    );
    expect(forbidden.status()).toBe(403);

    const approved = await request.post(
      `/api/approvals/${submitted.approval.id}/decide`,
      {
        headers: {
          cookie: `${cookieName}=${ownerToken}`,
          "content-type": "application/json",
        },
        data: { decision: "approved" },
      },
    );
    expect(approved.ok(), await approved.text()).toBeTruthy();
    await memberCtx.close();
  });

  test("FX settings show user-set rates", async ({ browser }) => {
    const ownerCtx = await asUser(browser, ownerToken);
    const page = await ownerCtx.newPage();
    await page.goto("/settings/currency");
    await expect(page.getByRole("heading", { name: "Currency" })).toBeVisible();
    await expect(page.getByText(/user-set/i)).toBeVisible();
    await expect(page.getByText("EUR")).toBeVisible();
    await ownerCtx.close();
  });
});
