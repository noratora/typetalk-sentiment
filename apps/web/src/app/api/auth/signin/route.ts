import { signIn } from "@/auth";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  await signIn("typetalk", { redirectTo: callbackUrl });
}
