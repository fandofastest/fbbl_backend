import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { CategoryModel } from "@/models/Category";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const filter = {
      isActive: true,
      ...(q ? { name: { $regex: q, $options: "i" } } : {}),
    };

    const items = await CategoryModel.find(filter)
      .sort({ createdAt: -1 })
      .select("name slug imageUrl")
      .lean();

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "internal error" }, { status: 500 });
  }
}
