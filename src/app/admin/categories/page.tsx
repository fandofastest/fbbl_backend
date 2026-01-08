"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
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

export default function AdminCategoriesPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!token) router.replace("/admin/login");
  }, [router, token]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: Category[] }>("/api/categories");
      setItems(data.items ?? []);
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
      await api("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name, slug: slug || undefined, imageUrl, isActive: true }),
      });
      setName("");
      setSlug("");
      setImageUrl("");
      setImageFile(null);
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
      form.append("folder", "categories");

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
    if (!confirm("Delete category?")) return;
    setLoading(true);
    setError(null);
    try {
      await api(`/api/categories/${id}`, { method: "DELETE" });
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
        <h1 className="text-xl font-semibold">Categories</h1>
        <p className="text-sm text-zinc-600">Foto wajib untuk kategori (pakai URL)</p>
      </div>

      <div className="rounded-xl bg-white border border-zinc-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug (optional)</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Image URL</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
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
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            disabled={loading || !name || !imageUrl}
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            onClick={create}
          >
            Add Category
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
          {items.map((c) => (
            <div key={c._id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-zinc-600 truncate">{c.slug}</div>
                <div className="text-xs text-zinc-600 truncate">{c.imageUrl}</div>
              </div>
              <button className="text-sm font-medium text-red-700" onClick={() => remove(c._id)}>
                Delete
              </button>
            </div>
          ))}
          {items.length === 0 ? <div className="px-5 py-6 text-sm text-zinc-600">No categories</div> : null}
        </div>
      </div>
    </div>
  );
}
