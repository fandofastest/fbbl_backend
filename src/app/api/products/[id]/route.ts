import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { ProductModel } from "@/models/Product";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { id } = ctx.params;
    const item = await ProductModel.findById(id).populate("categoryId", "name slug").lean();
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
      | {
          name?: string;
          categoryId?: string;
          sku?: string;
          description?: string;
          imageUrl?: string;
          price?: number;
          stock?: number;
          isActive?: boolean;
        }
      | null;

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      {
        ...(body?.name !== undefined ? { name: body.name } : {}),
        ...(body?.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body?.sku !== undefined ? { sku: body.sku } : {}),
        ...(body?.description !== undefined ? { description: body.description } : {}),
        ...(body?.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body?.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body?.stock !== undefined ? { stock: Number(body.stock) } : {}),
        ...(body?.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item: updated });
  } catch (e: any) {
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
    const deleted = await ProductModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
