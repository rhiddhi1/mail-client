"use client";

import { useState } from "react";
import { ArrowLeft, Inbox, Pencil, RefreshCw, Send } from "lucide-react";

type Account = {
  id: string;
  name: string;
  emailAddress: string;
  inboxCount: number;
};

type Address = {
  name: string | null;
  address: string;
};

type MailItem = {
  id: string;
  accountId: string;
  subject: string;
  receivedAt: string;
  receivedAtLabel: string;
  bodyText: string;
  from: Address;
  to: Address[];
  cc: Address[];
};

type MailboxProps = {
  accounts: Account[];
  emails: MailItem[];
};

export default function Mailbox({ accounts, emails }: MailboxProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const accountEmails = emails.filter((email) => email.accountId === accountId);
  const visibleEmails = accountEmails;
  const selectedEmail = visibleEmails.find((email) => email.id === selectedId);
  const detailOpen = composing || Boolean(selectedEmail);

  async function handleSyncInbox() {
    if (!accountId) return;

    setSyncing(true);
    setSyncError("");
    try {
      const response = await fetch("/api/initial-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountID: accountId }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to sync inbox");
      }
      window.location.reload();
    } catch (syncError) {
      setSyncError(
        syncError instanceof Error ? syncError.message : "Unable to sync inbox",
      );
    } finally {
      setSyncing(false);
    }
  }

  function openCompose() {
    setComposing(true);
    setSelectedId(null);
    setError("");
    setNotice("");
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");

    const recipientList = to.split(/[;,\s]+/).filter(Boolean);
    const ccList = cc.split(/[;,\s]+/).filter(Boolean);

    try {
      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: recipientList,
          cc: ccList,
          subject,
          body,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to send email");

      setNotice("Message sent.");
      setComposing(false);
      setTo("");
      setCc("");
      setSubject("");
      setBody("");
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Unable to send email",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-border md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="grid size-8 place-items-center rounded-md bg-foreground font-serif text-lg italic text-background">
            m
          </span>
          <span className="font-semibold">Mailroom</span>
        </div>

        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={openCompose}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background hover:opacity-90"
          >
            <Pencil aria-hidden="true" className="size-4" />
            Send mail
          </button>
        </div>

        <nav
          aria-label="Mail folders"
          className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col"
        >
          <button
            type="button"
            aria-current="page"
            className="flex h-10 shrink-0 items-center gap-3 rounded-md bg-muted px-3 text-sm font-medium"
          >
            <Inbox aria-hidden="true" className="size-4" />
            Inbox
            <span className="ml-auto text-xs">{accountEmails.length}</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-border p-4">
          <label
            htmlFor="mail-account"
            className="mb-2 block text-xs font-medium text-muted-foreground"
          >
            Mail account
          </label>
          {accounts.length > 0 ? (
            <select
              id="mail-account"
              value={accountId}
              onChange={(event) => {
                setAccountId(event.target.value);
                setSelectedId(null);
                setComposing(false);
              }}
              className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.emailAddress} ({account.inboxCount})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground">No linked accounts</p>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1">
        <section
          aria-label="Inbox messages"
          className={`${detailOpen ? "hidden md:flex" : "flex"} w-full min-w-0 flex-col border-r border-border md:w-85 md:shrink-0`}
        >
          <header className="flex h-18 items-center justify-between border-b border-border px-5">
            <div>
              <h1 className="font-semibold">Inbox</h1>
              <p className="text-xs text-muted-foreground">
                {visibleEmails.length} messages
              </p>
            </div>
            <button
              type="button"
              title="Fetch recent messages"
              aria-label="Sync inbox"
              onClick={handleSyncInbox}
              disabled={!accountId || syncing}
              className="grid size-9 place-items-center rounded-md hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-4 ${syncing ? "animate-spin" : ""}`}
              />
            </button>
          </header>
          {syncError && (
            <p
              role="alert"
              className="border-b border-border px-5 py-3 text-sm text-destructive"
            >
              {syncError}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="border-b border-border px-5 py-3 text-sm text-muted-foreground"
            >
              {notice}
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visibleEmails.length === 0 ? (
              <p className="px-5 py-10 text-sm text-muted-foreground">
                {accountId
                  ? "No stored messages. Sync the inbox to fetch recent mail."
                  : "Link a mail account to get started."}
              </p>
            ) : (
              visibleEmails.map((email) => (
                <button
                  type="button"
                  key={email.id}
                  onClick={() => {
                    setSelectedId(email.id);
                    setComposing(false);
                    setNotice("");
                  }}
                  aria-pressed={email.id === selectedId}
                  className={`block w-full border-b border-border px-5 py-4 text-left hover:bg-muted/60 ${email.id === selectedId ? "bg-muted" : ""}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">
                      {email.from.name || email.from.address}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {email.receivedAtLabel}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-sm">
                    {email.subject || "(No subject)"}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                    {email.bodyText}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section
          aria-label="Message"
          className={`${detailOpen ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}
        >
          {composing ? (
            <>
              <header className="flex h-18 items-center gap-3 border-b border-border px-5">
                <button
                  type="button"
                  onClick={() => setComposing(false)}
                  aria-label="Back to messages"
                  className="grid size-9 place-items-center rounded-md hover:bg-muted md:hidden"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </button>
                <h2 className="font-semibold">New message</h2>
              </header>
              <form
                onSubmit={handleSend}
                className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-5 sm:px-8"
              >
                <label className="border-b border-border py-3 text-sm">
                  <span className="mr-3 text-muted-foreground">To</span>
                  <input
                    type="text"
                    required
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    placeholder="name@example.com"
                    className="w-[calc(100%-48px)] bg-transparent outline-none placeholder:text-muted-foreground/70"
                  />
                </label>
                <label className="border-b border-border py-3 text-sm">
                  <span className="mr-3 text-muted-foreground">Cc</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(event) => setCc(event.target.value)}
                    placeholder="Optional"
                    className="w-[calc(100%-48px)] bg-transparent outline-none placeholder:text-muted-foreground/70"
                  />
                </label>
                <label className="border-b border-border py-3 text-sm">
                  <span className="mr-3 text-muted-foreground">Subject</span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="w-[calc(100%-72px)] bg-transparent outline-none"
                  />
                </label>
                <textarea
                  required
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your message"
                  className="min-h-0 flex-1 resize-none py-5 text-sm leading-6 outline-none placeholder:text-muted-foreground/70"
                />
                {error && (
                  <p role="alert" className="mb-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <p
                    aria-live="polite"
                    className="text-sm text-muted-foreground"
                  >
                    {notice}
                  </p>
                  <button
                    type="submit"
                    disabled={sending || !accountId}
                    className="flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send aria-hidden="true" className="size-4" />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </>
          ) : selectedEmail ? (
            <>
              <header className="flex min-h-18 items-center gap-3 border-b border-border px-5">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to messages"
                  className="grid size-9 place-items-center rounded-md hover:bg-muted md:hidden"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </button>
                <h2 className="truncate font-semibold">
                  {selectedEmail.subject || "(No subject)"}
                </h2>
              </header>
              <article className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                <div className="mx-auto max-w-3xl">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
                    <div>
                      <p className="font-medium">
                        {selectedEmail.from.name || selectedEmail.from.address}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedEmail.from.address}
                      </p>
                      {selectedEmail.to.length > 0 && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          To:{" "}
                          {selectedEmail.to
                            .map((recipient) => recipient.address)
                            .join(", ")}
                        </p>
                      )}
                      {selectedEmail.cc.length > 0 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Cc:{" "}
                          {selectedEmail.cc
                            .map((recipient) => recipient.address)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    <time
                      className="text-sm text-muted-foreground"
                      dateTime={selectedEmail.receivedAt}
                    >
                      {selectedEmail.receivedAtLabel}
                    </time>
                  </div>
                  <div className="whitespace-pre-wrap wrap-break-word py-6 text-sm leading-7">
                    {selectedEmail.bodyText ||
                      "(This message has no stored body.)"}
                  </div>
                </div>
              </article>
            </>
          ) : (
            <div className="hidden flex-1 items-center justify-center text-sm text-muted-foreground md:flex">
              Select a message to read it.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
