import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function MailPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const emails = await prisma.email.findMany({
    where: {
      emailLabel: "inbox",
      thread: { account: { userId } },
    },
    select: {
      id: true,
      subject: true,
      receivedAt: true,
      bodySnippet: true,
      from: { select: { name: true, address: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <header className="mb-6 border-b border-border pb-5">
          <p className="text-sm text-muted-foreground">Mailroom</p>
          <h1 className="mt-1 text-2xl font-semibold">Inbox</h1>
        </header>

        {emails.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No stored inbox emails yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {emails.map((email) => (
              <li key={email.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-medium">
                    {email.from.name || email.from.address}
                    {email.from.name && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {email.from.address}
                      </span>
                    )}
                  </p>
                  <time
                    className="text-sm text-muted-foreground"
                    dateTime={email.receivedAt.toISOString()}
                  >
                    {email.receivedAt.toLocaleDateString()}
                  </time>
                </div>
                <h2 className="mt-1 font-medium">
                  {email.subject || "(No subject)"}
                </h2>
                {email.bodySnippet && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {email.bodySnippet}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
