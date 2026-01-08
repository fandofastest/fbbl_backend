import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { signUserToken } from "@/lib/auth";
import { UserModel } from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;

    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "email/password required" }, { status: 400 });
    }

    const userDoc = await UserModel.findOne({ email }).lean();
    if (!userDoc) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    if (userDoc.isActive === false) {
      return NextResponse.json({ error: "user inactive" }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, userDoc.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const token = signUserToken(String(userDoc._id));
    const { passwordHash: _ph, ...user } = userDoc;

    return NextResponse.json({ token, user });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "internal error" }, { status: 500 });
  }
}
