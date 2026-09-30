import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Mailbox from "./mailbox-view";
import { redirect } from "next/navigation";
import { turndown } from "@/lib/turndown";

export default async function MailPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true, name: true, emailAddress: true },
    orderBy: { emailAddress: "asc" },
  });

  const emails = await prisma.email.findMany({
    where: {
      thread: { account: { userId } },
    },
    select: {
      id: true,
      subject: true,
      receivedAt: true,
      emailLabel: true,
      sysLabels: true,
      sysClassifications: true,
      body: true,
      bodySnippet: true,
      from: { select: { name: true, address: true } },
      to: { select: { name: true, address: true } },
      cc: { select: { name: true, address: true } },
      thread: { select: { accountId: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 500,
  });

  const inboxCounts = new Map<string, number>();
  for (const email of emails) {
    if (email.emailLabel !== "inbox") continue;
    const accountId = email.thread.accountId;
    inboxCounts.set(accountId, (inboxCounts.get(accountId) ?? 0) + 1);
  }
  const accountsWithCounts = accounts
    .map((account) => ({
      ...account,
      inboxCount: inboxCounts.get(account.id) ?? 0,
    }))
    .sort((first, second) => second.inboxCount - first.inboxCount);

  return (
    <Mailbox
      accounts={accountsWithCounts}
      emails={emails.map((email) => ({
        id: email.id,
        accountId: email.thread.accountId,
        folder: email.emailLabel as "inbox" | "sent" | "draft",
        labels: email.sysLabels,
        classifications: email.sysClassifications,
        subject: email.subject,
        receivedAt: email.receivedAt.toISOString(),
        receivedAtLabel: new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(email.receivedAt),
        bodyText: email.body
          ? turndown.turndown(email.body)
          : (email.bodySnippet ?? ""),
        from: email.from,
        to: email.to,
        cc: email.cc,
      }))}
    />
  );
}
