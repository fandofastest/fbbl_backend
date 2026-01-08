import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { TransaksiModel } from "@/models/Transaksi";
import { UserModel } from "@/models/User";
import { ProductModel } from "@/models/Product";

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    await dbConnect();

    const items = await TransaksiModel.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .populate("items.productId", "name sku price")
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
          userId?: string;
          items?: Array<{ productId: string; qty: number }>;
          status?: "pending" | "paid" | "shipped" | "done" | "cancelled";
        }
      | null;

    if (!body?.userId || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "userId/items required" }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(body.userId)) {
      return NextResponse.json({ error: "invalid userId" }, { status: 400 });
    }

    const user = await UserModel.findById(body.userId).lean();
    if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

    const productIds = body.items.map((it) => it.productId);
    const products = await ProductModel.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p: any) => [String(p._id), p]));

    for (const it of body.items) {
      if (!Types.ObjectId.isValid(it.productId)) {
        return NextResponse.json({ error: `invalid productId: ${it.productId}` }, { status: 400 });
      }
      if (!productMap.has(it.productId)) {
        return NextResponse.json({ error: `product not found: ${it.productId}` }, { status: 404 });
      }
      if (!it.qty || it.qty < 1) {
        return NextResponse.json({ error: "qty must be >= 1" }, { status: 400 });
      }
    }

    const normalizedItems = body.items.map((it) => {
      const p: any = productMap.get(it.productId);
      return { productId: new Types.ObjectId(it.productId), qty: Number(it.qty), price: Number(p.price) };
    });

    const total = normalizedItems.reduce((sum, it) => sum + it.qty * it.price, 0);

    const created = await TransaksiModel.create({
      userId: new Types.ObjectId(body.userId),
      items: normalizedItems,
      total,
      status: body.status ?? "pending",
    });

    const populated = await TransaksiModel.findById(created._id)
      .populate("userId", "name email")
      .populate("items.productId", "name sku price")
      .lean();

    return NextResponse.json({ item: populated }, { status: 201 });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
