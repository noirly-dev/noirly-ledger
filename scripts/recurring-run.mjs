const secret = process.env.CRON_SECRET;
const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003";

if (!secret) {
  console.error("CRON_SECRET is required");
  process.exit(1);
}

const res = await fetch(`${base.replace(/\/$/, "")}/api/cron/recurring`, {
  method: "POST",
  headers: { authorization: `Bearer ${secret}` },
});
const text = await res.text();
if (!res.ok) {
  console.error(text);
  process.exit(1);
}
console.log(text);
