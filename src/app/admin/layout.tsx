import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="font-semibold text-zinc-900">
              Admin
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link className="text-zinc-700 hover:text-zinc-900" href="/admin/categories">
                Categories
              </Link>
              <Link className="text-zinc-700 hover:text-zinc-900" href="/admin/products">
                Products
              </Link>
              <Link className="text-zinc-700 hover:text-zinc-900" href="/admin/users">
                Users
              </Link>
              <Link className="text-zinc-700 hover:text-zinc-900" href="/admin/transaksi">
                Transaksi
              </Link>
            </nav>
          </div>
          <Link href="/admin/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            Login
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
    </div>
  );
}
