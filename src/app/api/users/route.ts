import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { UserModel } from "@/models/User";

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const items = await UserModel.find(filter)
      .sort({ createdAt: -1 })
      .select("-passwordHash")
      .lean();

    return NextResponse.json({ items });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}

export async function POST(req: Request) {
  try {
    requireAdmin(req);
    await dbConnect();

    const body = (await req.json().catch(() => null)) as
      | {
          name?: string;
          email?: string;
          password?: string;
          phone?: string;
          address?: string;
          isActive?: boolean;
        }
      | null;

    if (!body?.name || !body?.email || !body?.password) {
      return NextResponse.json({ error: "name/email/password required" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const created = await UserModel.create({
      name: body.name,
      email: body.email,
      passwordHash,
      phone: body.phone ?? "",
      address: body.address ?? "",
      isActive: body.isActive ?? true,
    });

    const safe = await UserModel.findById(created._id).select("-passwordHash").lean();
    return NextResponse.json({ item: safe }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "email already exists" }, { status: 409 });
    }
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
