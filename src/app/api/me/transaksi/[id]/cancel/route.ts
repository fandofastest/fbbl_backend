import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { TransaksiModel } from "@/models/Transaksi";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = requireUser(req);
    await dbConnect();

    const { id } = await ctx.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "invalid transaksi id" }, { status: 400 });
    }

    const trx = await TransaksiModel.findById(id);
    if (!trx) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (String(trx.userId) !== String(user.sub)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (trx.status === "cancelled") {
      return NextResponse.json({ item: trx });
    }

    if (trx.status === "done" || trx.status === "shipped") {
      return NextResponse.json({ error: "cannot cancel" }, { status: 400 });
    }

    trx.status = "cancelled";
    await trx.save();

    const populated = await TransaksiModel.findById(trx._id)
      .populate("items.productId", "name sku price imageUrl")
      .lean();

    return NextResponse.json({ item: populated });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
