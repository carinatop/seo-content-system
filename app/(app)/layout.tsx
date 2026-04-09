import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>SEO Studio</h1>
        <nav>
          <Link href="/brands">Brands</Link>
          <Link href="/drafts">All Articles</Link>
          <Link href="/published">Published</Link>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
