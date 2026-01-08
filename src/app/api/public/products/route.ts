import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("categoryId")?.trim();

    const filter: any = { isActive: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
      ];
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    const items = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .populate("categoryId", "name slug")
      .select("name sku description imageUrl price stock categoryId")
      .lean();

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "internal error" }, { status: 500 });
  }
}
