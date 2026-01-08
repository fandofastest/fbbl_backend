import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { ProductModel } from "@/models/Product";

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
            { sku: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const items = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("categoryId", "name slug")
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
          categoryId?: string;
          sku?: string;
          description?: string;
          imageUrl?: string;
          price?: number;
          stock?: number;
          isActive?: boolean;
        }
      | null;

    if (!body?.name || !body?.categoryId || !body?.imageUrl || body.price === undefined) {
      return NextResponse.json(
        { error: "name/categoryId/imageUrl/price required" },
        { status: 400 }
      );
    }

    const created = await ProductModel.create({
      name: body.name,
      categoryId: body.categoryId,
      sku: body.sku,
      description: body.description ?? "",
      imageUrl: body.imageUrl,
      price: Number(body.price),
      stock: Number(body.stock ?? 0),
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
