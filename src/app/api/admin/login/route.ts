import { NextResponse } from "next/server";
import { isValidAdminCredentials, signAdminToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { username?: string; password?: string }
      | null;

    const username = body?.username?.toString() ?? "";
    const password = body?.password?.toString() ?? "";

    if (!username || !password) {
      return NextResponse.json({ error: "username/password required" }, { status: 400 });
    }

    if (!isValidAdminCredentials(username, password)) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const token = signAdminToken();
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
