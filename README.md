# Noirly Ledger

Dark-mode budgeting and finance tracking for individuals and teams. Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Phase 0 status

Foundations: Next.js App Router, Auth.js + Noirly Identity, MongoDB models, personal workspace bootstrap, app shell + workspace switcher, `LedgerSyncProvider` stub.

## Setup

1. Ensure Noirly Identity is running on `:3000` and MongoDB is available.
2. Register a **real** confidential OAuth client (do not use `db:seed`):

   ```bash
   cd ../noirly-identity
   npm run client:register -- --client-id=noirly-ledger --name=NoirlyLedger --redirect-uri=http://localhost:3003/api/auth/callback/noirly
   ```

3. Copy env and paste the printed `client_secret` into `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

4. Install and run (requires `GITHUB_TOKEN` for `@noirly-dev/*` packages):

   ```bash
   pnpm install
   pnpm dev
   ```

App: [http://localhost:3003](http://localhost:3003)
