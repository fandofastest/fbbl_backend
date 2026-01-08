"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type User = { _id: string; name: string; email: string };
type Product = { _id: string; name: string; sku?: string; price: number; imageUrl?: string };

type Transaksi = {
  _id: string;
  userId: User;
  items: Array<{ productId: Product; qty: number; price: number }>;
  total: number;
  status: string;
  createdAt: string;
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

export default function AdminTransaksiPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Transaksi[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");

  useEffect(() => {
    if (!token) router.replace("/admin/login");
  }, [router, token]);

  async function refreshAll() {
    setLoading(true);
    setError(null);
    try {
      const [u, p, t] = await Promise.all([
        api<{ items: User[] }>("/api/users"),
        api<{ items: Product[] }>("/api/products"),
        api<{ items: Transaksi[] }>("/api/transaksi"),
      ]);
      setUsers(u.items ?? []);
      setProducts(p.items ?? []);
      setItems(t.items ?? []);
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
    refreshAll();
  }, []);

  async function createTransaksi() {
    setLoading(true);
    setError(null);
    try {
      await api("/api/transaksi", {
        method: "POST",
        body: JSON.stringify({
          userId,
          items: [{ productId, qty: Number(qty) }],
          status: "pending",
        }),
      });
      setUserId("");
      setProductId("");
      setQty("1");
      await refreshAll();
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Transaksi</h1>
        <p className="text-sm text-zinc-600">Buat transaksi sederhana dan lihat daftar transaksi</p>
      </div>

      <div className="rounded-xl bg-white border border-zinc-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">User</label>
            <select
              className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Product</label>
            <select
              className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.sku ? `(${p.sku})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Qty</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            disabled={loading || !userId || !productId || Number(qty) < 1}
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            onClick={createTransaksi}
          >
            Create Transaksi
          </button>
          <button
            disabled={loading}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-60"
            onClick={refreshAll}
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
          {items.map((t) => (
            <div key={t._id} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.userId?.name ?? "-"}</div>
                <div className="text-xs text-zinc-600">{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-1 text-xs text-zinc-700">Status: {t.status} | Total: {t.total}</div>
              <div className="mt-2 text-xs text-zinc-600">
                {t.items?.map((it, idx) => (
                  <div key={idx}>
                    {it.productId?.name ?? "-"} x{it.qty} @ {it.price}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {items.length === 0 ? <div className="px-5 py-6 text-sm text-zinc-600">No transaksi</div> : null}
        </div>
      </div>
    </div>
  );
}
