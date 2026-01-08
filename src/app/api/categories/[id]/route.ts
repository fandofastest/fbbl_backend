import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { CategoryModel } from "@/models/Category";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { id } = ctx.params;
    const item = await CategoryModel.findById(id).lean();
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { id } = ctx.params;
    const body = (await req.json().catch(() => null)) as
      | { name?: string; slug?: string; imageUrl?: string; isActive?: boolean }
      | null;

    const patch: Record<string, unknown> = {};
    if (body?.name !== undefined) patch.name = body.name;
    if (body?.imageUrl !== undefined) patch.imageUrl = body.imageUrl;
    if (body?.isActive !== undefined) patch.isActive = body.isActive;
    if (body?.slug !== undefined) patch.slug = slugify(body.slug);

    const updated = await CategoryModel.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item: updated });
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "slug already exists" }, { status: 409 });
    }
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { id } = ctx.params;
    const deleted = await CategoryModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
