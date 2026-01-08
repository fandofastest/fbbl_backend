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

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const filter = q ? { name: { $regex: q, $options: "i" } } : {};
    const items = await CategoryModel.find(filter).sort({ createdAt: -1 }).lean();
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
      | { name?: string; slug?: string; imageUrl?: string; isActive?: boolean }
      | null;

    if (!body?.name || !body?.imageUrl) {
      return NextResponse.json({ error: "name/imageUrl required" }, { status: 400 });
    }

    const slug = (body.slug?.trim() || slugify(body.name)) as string;
    if (!slug) return NextResponse.json({ error: "invalid slug" }, { status: 400 });

    const created = await CategoryModel.create({
      name: body.name,
      slug,
      imageUrl: body.imageUrl,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "slug already exists" }, { status: 409 });
    }
    const msg = e?.message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg ?? "internal error" }, { status });
  }
}
