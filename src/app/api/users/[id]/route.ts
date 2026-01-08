import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { UserModel } from "@/models/User";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { id } = await ctx.params;
    const item = await UserModel.findById(id).select("-passwordHash").lean();
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { id } = await ctx.params;

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

    const patch: Record<string, unknown> = {};
    if (body?.name !== undefined) patch.name = body.name;
    if (body?.email !== undefined) patch.email = body.email;
    if (body?.phone !== undefined) patch.phone = body.phone;
    if (body?.address !== undefined) patch.address = body.address;
    if (body?.isActive !== undefined) patch.isActive = body.isActive;
    if (body?.password) patch.passwordHash = await bcrypt.hash(body.password, 10);

    const updated = await UserModel.findByIdAndUpdate(id, patch, { new: true })
      .select("-passwordHash")
      .lean();

    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item: updated });
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "email already exists" }, { status: 409 });
    }
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { id } = await ctx.params;
    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
