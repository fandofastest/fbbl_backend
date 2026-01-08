import { NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { TransaksiModel } from "@/models/Transaksi";
import { ProductModel } from "@/models/Product";

export async function GET(req: Request) {
  try {
    const user = requireUser(req);
    await dbConnect();

    const userId = user.sub;

    const items = await TransaksiModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name sku price imageUrl")
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
    const user = requireUser(req);
    await dbConnect();

    const userId = user.sub;
    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "invalid user" }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as
      | {
          items?: Array<{ productId: string; qty: number }>;
        }
      | null;

    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    for (const it of body.items) {
      if (!Types.ObjectId.isValid(it.productId)) {
        return NextResponse.json({ error: `invalid productId: ${it.productId}` }, { status: 400 });
      }
      if (!it.qty || it.qty < 1) {
        return NextResponse.json({ error: "qty must be >= 1" }, { status: 400 });
      }
    }

    const productIds = body.items.map((it) => new Types.ObjectId(it.productId));
    const products = await ProductModel.find({ _id: { $in: productIds }, isActive: true }).lean();
    const productMap = new Map(products.map((p: any) => [String(p._id), p]));

    for (const it of body.items) {
      if (!productMap.has(it.productId)) {
        return NextResponse.json({ error: `product not found: ${it.productId}` }, { status: 404 });
      }
    }

    const normalizedItems = body.items.map((it) => {
      const p: any = productMap.get(it.productId);
      return {
        productId: new Types.ObjectId(it.productId),
        qty: Number(it.qty),
        price: Number(p.price),
      };
    });

    const total = normalizedItems.reduce((sum, it) => sum + it.qty * it.price, 0);

    const created = await TransaksiModel.create({
      userId: new Types.ObjectId(userId),
      items: normalizedItems,
      total,
      status: "pending",
    });

    const populated = await TransaksiModel.findById(created._id)
      .populate("items.productId", "name sku price imageUrl")
      .lean();

    return NextResponse.json({ item: populated }, { status: 201 });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
