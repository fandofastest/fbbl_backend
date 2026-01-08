"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  name: string;
  categoryId: Category | string;
  sku?: string;
  description?: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      authorization: token ? `Bearer ${token}` : "",
      "content-type": "application/json",
    },
  });

  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    throw new Error(data?.error ?? "request failed");
  }
  return data as T;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!token) router.replace("/admin/login");
  }, [router, token]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        api<{ items: Category[] }>("/api/categories"),
        api<{ items: Product[] }>("/api/products"),
      ]);
      setCategories(cats.items ?? []);
      setItems(prods.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "error");
      if (String(e?.message).toLowerCase().includes("unauthorized")) {
        router.replace("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      await api("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          categoryId,
          sku: sku || undefined,
          description: description || undefined,
          imageUrl,
          price: Number(price),
          stock: Number(stock),
          isActive: true,
        }),
      });
      setName("");
      setCategoryId("");
      setSku("");
      setDescription("");
      setImageUrl("");
      setImageFile(null);
      setPrice("0");
      setStock("0");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage() {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const form = new FormData();
      form.append("file", imageFile);
      form.append("folder", "products");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          authorization: token ? `Bearer ${token}` : "",
        },
        body: form,
      });

      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? "upload failed");
      }

      setImageUrl(data.url);
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete product?")) return;
    setLoading(true);
    setError(null);
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Products</h1>
        <p className="text-sm text-zinc-600">Tambah dan lihat daftar produk</p>
      </div>

      <div className="rounded-xl bg-white border border-zinc-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <select
              className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">SKU</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Image URL</label>
            <input
              className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Upload Image (Cloudinary)</label>
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                disabled={loading || !imageFile}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-60"
                onClick={uploadImage}
              >
                Upload
              </button>
              <div className="text-xs text-zinc-600 truncate">{imageFile ? imageFile.name : "No file"}</div>
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <input
              className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Price</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Stock</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            disabled={loading || !name || !categoryId || !imageUrl}
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            onClick={create}
          >
            Add Product
          </button>
          <button
            disabled={loading}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-60"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
      </div>

      <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
          <div className="text-sm font-medium">List</div>
          <div className="text-xs text-zinc-500">{loading ? "Loading..." : `${items.length} items`}</div>
        </div>
        <div className="divide-y divide-zinc-200">
          {items.map((p) => (
            <div key={p._id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-zinc-600">
                  Category: {typeof p.categoryId === "string" ? p.categoryId : p.categoryId?.name} | SKU: {p.sku || "-"} | Price: {p.price} | Stock: {p.stock}
                </div>
                <div className="text-xs text-zinc-600 truncate">Image: {p.imageUrl}</div>
              </div>
              <button className="text-sm font-medium text-red-700" onClick={() => remove(p._id)}>
                Delete
              </button>
            </div>
          ))}
          {items.length === 0 ? <div className="px-5 py-6 text-sm text-zinc-600">No products</div> : null}
        </div>
      </div>
    </div>
  );
}
