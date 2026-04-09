import Link from "next/link";
export default function Home() {
  return (
    <main className="main">
      <h2>AI SEO Content System</h2>
      <p className="sub">Multi-brand SEO writing studio powered by Claude.</p>
      <div className="card">
        <Link href="/dashboard">→ Open dashboard</Link>
      </div>
    </main>
  );
}
