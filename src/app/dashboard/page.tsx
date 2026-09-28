import { Button } from "@/components/ui/button";
import { getAurinkoAuthURL } from "@/lib/aurinko";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function Dashboard() {
  return (
    <div className="mailroom-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Mailroom home">
          <span className="wordmark-mark" aria-hidden="true">
            m
          </span>
          <span>mailroom</span>
        </Link>
        <nav className="account-actions" aria-label="Account">
          <Link
            className="button button-quiet"
            href="/dashboard"
            aria-current="page"
          >
            Dashboard
          </Link>
          <UserButton />
        </nav>
      </header>

      <main className="dashboard-main">
        <p className="eyebrow">
          <span className="status-dot" /> Your personal inbox
        </p>
        <h1>Dashboard</h1>
        <p className="dashboard-description">
          Your Mailroom workspace is ready. Your inbox will live here.
        </p>
      </main>

      <footer className="page-footer">
        <span>
          MAILROOM <span className="footer-separator">/</span> YOUR PERSONAL
          INBOX
        </span>
        <span>Made for the messages that matter.</span>
      </footer>
    </div>
  );
}
