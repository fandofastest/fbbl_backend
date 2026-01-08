"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
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

export default function AdminUsersPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!token) router.replace("/admin/login");
  }, [router, token]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: User[] }>("/api/users");
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
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || undefined,
          address: address || undefined,
          isActive: true,
        }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setAddress("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete user?")) return;
    setLoading(true);
    setError(null);
    try {
      await api(`/api/users/${id}`, { method: "DELETE" });
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
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-zinc-600">Tambah dan lihat daftar user</p>
      </div>

      <div className="rounded-xl bg-white border border-zinc-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Phone</label>
            <input className="w-full rounded-lg border border-zinc-200 px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Address</label>
            <input
              className="w-full rounded-lg border border-zinc-200 px-3 py-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            disabled={loading || !name || !email || !password}
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            onClick={create}
          >
            Add User
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
          {items.map((u) => (
            <div key={u._id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-zinc-600">
                  {u.email} | {u.phone || "-"}
                </div>
              </div>
              <button className="text-sm font-medium text-red-700" onClick={() => remove(u._id)}>
                Delete
              </button>
            </div>
          ))}
          {items.length === 0 ? <div className="px-5 py-6 text-sm text-zinc-600">No users</div> : null}
        </div>
      </div>
    </div>
  );
}
