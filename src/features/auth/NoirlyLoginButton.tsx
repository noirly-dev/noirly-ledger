import { signIn } from "@/auth";

export function NoirlyLoginButton({ redirectTo = "/home" }: { redirectTo?: string }) {
  const target =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/home";

  return (
    <form
      action={async () => {
        "use server";
        await signIn("noirly", { redirectTo: target });
      }}
    >
      <button
        className="flex h-12 w-full cursor-pointer items-center justify-center bg-panel-ink px-5 font-mono text-[11px] font-semibold tracking-[0.16em] text-panel uppercase transition-colors hover:bg-transparent hover:text-panel-ink hover:outline hover:outline-1 hover:outline-dashed hover:outline-panel-ink"
        type="submit"
      >
        Noirly Login
      </button>
    </form>
  );
}
