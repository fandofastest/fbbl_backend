import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";
import { TransaksiModel } from "@/models/Transaksi";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { id } = await ctx.params;

    const deleted = await TransaksiModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
