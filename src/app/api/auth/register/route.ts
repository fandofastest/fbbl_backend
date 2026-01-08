import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { signUserToken } from "@/lib/auth";
import { UserModel } from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json().catch(() => null)) as
      | {
          name?: string;
          email?: string;
          password?: string;
          phone?: string;
          address?: string;
        }
      | null;

    const name = body?.name?.trim() ?? "";
    const email = body?.email?.trim().toLowerCase() ?? "";
    const password = body?.password ?? "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name/email/password required" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await UserModel.create({
      name,
      email,
      passwordHash,
      phone: body?.phone ?? "",
      address: body?.address ?? "",
      isActive: true,
    });

    const token = signUserToken(String(created._id));

    const user = await UserModel.findById(created._id).select("-passwordHash").lean();

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message ?? "internal error" }, { status: 500 });
  }
}
