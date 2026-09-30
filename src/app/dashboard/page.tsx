import { getAurinkoAuthURL } from "@/lib/aurinko";
import prisma from "@/lib/prisma";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const account = await prisma.account.findFirst({
    where: { userId, accessToken: { not: "" } },
    select: { emailAddress: true },
  });
  const connectUrl = account ? null : await getAurinkoAuthURL("Google");

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
          {account
            ? `Connected as ${account.emailAddress}. Your inbox is ready.`
            : "Connect your email account to open your inbox."}
        </p>
        {account ? (
          <Link className="button button-dark" href="/mail">
            Go to inbox
          </Link>
        ) : (
          <a className="button button-coral" href={connectUrl ?? undefined}>
            Connect mail
          </a>
        )}
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
