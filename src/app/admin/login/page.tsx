"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json().catch(() => null)) as { token?: string; error?: string } | null;

      if (!res.ok || !data?.token) {
        setError(data?.error ?? "login failed");
        return;
      }

      localStorage.setItem("admin_token", data.token);
      router.replace("/admin/products");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white border border-zinc-200 p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <p className="mt-1 text-sm text-zinc-600">Masuk untuk mengelola data ecommerce</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
              placeholder="admin"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
              placeholder="********"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            type="submit"
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <button
            type="button"
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium"
            onClick={() => {
              localStorage.removeItem("admin_token");
              setUsername("");
              setPassword("");
            }}
          >
            Clear Token
          </button>
        </form>
      </div>
    </div>
  );
}
