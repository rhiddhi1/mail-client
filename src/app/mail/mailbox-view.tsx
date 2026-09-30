"use client";

import { useState, type FormEvent } from "react";
import {
  Archive,
  ArrowLeft,
  FileText,
  Inbox,
  MousePointer2,
  Pencil,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

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

type Folder =
  | "inbox"
  | "drafts"
  | "sent"
  | "junk"
  | "trash"
  | "archive"
  | "social"
  | "updates"
  | "forums"
  | "promotions";

type MailItem = {
  id: string;
  accountId: string;
  folder: "inbox" | "sent" | "draft";
  labels: string[];
  classifications: string[];
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

const primaryFolders: { id: Folder; label: string; icon: LucideIcon }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "sent", label: "Sent", icon: Send },
  { id: "junk", label: "Junk", icon: ShieldAlert },
  { id: "trash", label: "Trash", icon: Trash2 },
  { id: "archive", label: "Archive", icon: Archive },
];

const categories: { id: Folder; label: string; color: string }[] = [
  { id: "social", label: "Social", color: "bg-blue-500" },
  { id: "updates", label: "Updates", color: "bg-teal-400" },
  { id: "forums", label: "Forums", color: "bg-orange-500" },
  { id: "promotions", label: "Promotions", color: "bg-pink-600" },
];

const folderTitles: Record<Folder, string> = {
  inbox: "Inbox",
  drafts: "Drafts",
  sent: "Sent",
  junk: "Junk",
  trash: "Trash",
  archive: "Archive",
  social: "Social",
  updates: "Updates",
  forums: "Forums",
  promotions: "Promotions",
};

function belongsToFolder(email: MailItem, folder: Folder) {
  switch (folder) {
    case "inbox":
      return (
        email.folder === "inbox" &&
        !email.labels.includes("junk") &&
        !email.labels.includes("trash")
      );
    case "drafts":
      return email.folder === "draft" || email.labels.includes("draft");
    case "sent":
      return email.folder === "sent" || email.labels.includes("sent");
    case "junk":
      return email.labels.includes("junk");
    case "trash":
      return email.labels.includes("trash");
    case "archive":
      return (
        email.labels.includes("archive") || email.labels.includes("archived")
      );
    default:
      return email.classifications.includes(folder);
  }
}

function relativeDate(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const day = 24 * 60 * 60 * 1000;
  if (elapsed < day) return "today";
  const days = Math.floor(elapsed / day);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "about a year ago" : `about ${years} years ago`;
}

export default function MailboxView({ accounts, emails }: MailboxProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [notice, setNotice] = useState("");

  const accountEmails = emails.filter((email) => email.accountId === accountId);
  const folderEmails = accountEmails.filter((email) =>
    belongsToFolder(email, folder),
  );
  const visibleEmails = folderEmails.filter((email) => {
    if (unreadOnly && !email.labels.includes("unread")) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [email.from.name, email.from.address, email.subject, email.bodyText]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query));
  });
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
      if (!response.ok) throw new Error(result.error ?? "Unable to sync inbox");
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

  async function handleSend(event: FormEvent<HTMLFormElement>) {
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

  function countForFolder(folderId: Folder) {
    return accountEmails.filter((email) => belongsToFolder(email, folderId))
      .length;
  }

  return (
    <main className="h-dvh bg-[#111415] p-2 text-[#e5e7e7]">
      <div className="mailbox-layout h-full min-h-0 overflow-hidden rounded-lg border border-[#34393a] bg-[#171a1b]">
        <aside className="mailbox-sidebar flex shrink-0 flex-col border-b border-[#303536] bg-[#191c1d] md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 border-b border-[#303536] px-3 py-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#0d1011] font-serif text-lg italic text-white">
              m
            </span>
            <label className="sr-only" htmlFor="mail-account">
              Mail account
            </label>
            <select
              id="mail-account"
              value={accountId}
              onChange={(event) => {
                setAccountId(event.target.value);
                setSelectedId(null);
                setComposing(false);
              }}
              disabled={accounts.length === 0}
              className="min-w-0 flex-1 appearance-none truncate bg-transparent px-1 py-1 text-sm font-medium outline-none disabled:opacity-60"
            >
              {accounts.length === 0 ? (
                <option value="">No linked account</option>
              ) : (
                accounts.map((account) => (
                  <option
                    className="bg-[#191c1d]"
                    key={account.id}
                    value={account.id}
                  >
                    {account.name || account.emailAddress} ·{" "}
                    {account.inboxCount}
                  </option>
                ))
              )}
            </select>
            <span aria-hidden="true" className="text-xs text-[#969b9b]">
              ⌄
            </span>
          </div>

          <div className="px-3 py-3">
            <button
              type="button"
              onClick={openCompose}
              className="flex h-10 w-full items-center gap-3 rounded-md bg-[#0d1011] px-3 text-sm font-medium hover:bg-[#242829]"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Send mail
            </button>
          </div>

          <nav
            aria-label="Mail folders"
            className="min-h-0 overflow-y-auto px-2 pb-2"
          >
            <div className="space-y-1">
              {primaryFolders.map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  aria-current={folder === id ? "page" : undefined}
                  onClick={() => {
                    setFolder(id);
                    setSelectedId(null);
                    setComposing(false);
                    setNotice("");
                  }}
                  className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm ${folder === id ? "bg-[#242829] text-white" : "text-[#c5c8c8] hover:bg-[#212526]"}`}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span>{label}</span>
                  {countForFolder(id) > 0 && (
                    <span className="ml-auto rounded-full border border-[#3b4142] px-2 py-0.5 text-xs text-[#b7bcbc]">
                      {countForFolder(id)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="my-3 border-t border-[#303536]" />
            <div className="space-y-1">
              {categories.map(({ id, label, color }) => (
                <button
                  type="button"
                  key={id}
                  aria-current={folder === id ? "page" : undefined}
                  onClick={() => {
                    setFolder(id);
                    setSelectedId(null);
                    setComposing(false);
                  }}
                  className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm ${folder === id ? "bg-[#242829] text-white" : "text-[#c5c8c8] hover:bg-[#212526]"}`}
                >
                  <span className={`size-2.5 rounded-full ${color}`} />
                  <span>{label}</span>
                  {countForFolder(id) > 0 && (
                    <span className="ml-auto rounded-full border border-[#3b4142] px-2 py-0.5 text-xs text-[#b7bcbc]">
                      {countForFolder(id)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        <section
          aria-label={`${folderTitles[folder]} messages`}
          className={`mailbox-list ${detailOpen ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-col border-b border-[#303536] md:border-b-0 md:border-r`}
        >
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#303536] px-4">
            <h1 className="text-lg font-semibold">{folderTitles[folder]}</h1>
            <div className="flex items-center gap-3">
              <div className="flex rounded-full border border-[#303536] bg-[#202425] p-0.5 text-sm">
                <button
                  type="button"
                  aria-pressed={!unreadOnly}
                  onClick={() => setUnreadOnly(false)}
                  className={`rounded-full px-2.5 py-1 ${!unreadOnly ? "bg-[#303536] text-white" : "text-[#aeb3b3]"}`}
                >
                  All
                </button>
                <button
                  type="button"
                  aria-pressed={unreadOnly}
                  onClick={() => setUnreadOnly(true)}
                  className={`rounded-full px-2.5 py-1 ${unreadOnly ? "bg-[#303536] text-white" : "text-[#aeb3b3]"}`}
                >
                  Unread
                </button>
              </div>
              <button
                type="button"
                title="Fetch recent messages"
                aria-label="Sync inbox"
                onClick={handleSyncInbox}
                disabled={!accountId || syncing}
                className="grid size-9 place-items-center rounded-md text-[#c4c8c8] hover:bg-[#242829] disabled:opacity-50"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`size-4 ${syncing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </header>

          <div className="shrink-0 px-3 py-3">
            <label className="flex h-10 items-center gap-2 rounded-md border border-[#3a4041] bg-[#191c1d] px-3 text-[#aeb3b3] focus-within:border-[#626a6b]">
              <Search aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">Search mail</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#e5e7e7] outline-none placeholder:text-[#747a7b]"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="grid size-6 place-items-center rounded hover:bg-[#2b3031]"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              )}
            </label>
          </div>

          {syncError && (
            <p role="alert" className="px-4 pb-3 text-xs text-red-300">
              {syncError}
            </p>
          )}
          {notice && (
            <p role="status" className="px-4 pb-3 text-xs text-teal-300">
              {notice}
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {visibleEmails.length === 0 ? (
              <div className="px-3 py-8 text-sm text-[#9ba1a1]">
                {search
                  ? "No messages match this search."
                  : accountId
                    ? "No stored messages. Sync the inbox to fetch recent mail."
                    : "Link a mail account to get started."}
              </div>
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
                  className={`my-2 block w-full rounded-md border px-3 py-3 text-left transition-colors ${email.id === selectedId ? "border-[#505859] bg-[#222728]" : "border-[#303536] bg-[#1a1e1f] hover:border-[#484f50] hover:bg-[#202526]"}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`truncate text-sm ${email.labels.includes("unread") ? "font-semibold text-white" : "font-medium text-[#d5d8d8]"}`}
                      >
                        {email.from.name || email.from.address}
                      </span>
                      {email.labels.includes("unread") && (
                        <span
                          aria-label="Unread"
                          className="size-2 shrink-0 rounded-full bg-blue-500"
                        />
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-[#929898]">
                      {relativeDate(email.receivedAt)}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-[#e0e2e2]">
                    {email.subject || "(No subject)"}
                  </span>
                  <span className="mt-2 line-clamp-2 block text-sm leading-5 text-[#969c9c]">
                    {email.bodyText}
                  </span>
                  {email.classifications.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {email.classifications
                        .slice(0, 3)
                        .map((classification) => (
                          <span
                            key={classification}
                            className="rounded-full bg-[#101314] px-2.5 py-1 text-xs text-[#d1d4d4]"
                          >
                            {classification}
                          </span>
                        ))}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </section>

        <section
          aria-label="Message"
          className={`mailbox-reader ${detailOpen ? "flex" : "hidden md:flex"} flex-col bg-[#171a1b]`}
        >
          {composing ? (
            <>
              <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#303536] px-5">
                <button
                  type="button"
                  onClick={() => setComposing(false)}
                  aria-label="Back to messages"
                  className="grid size-9 place-items-center rounded-md text-[#c4c8c8] hover:bg-[#242829] md:hidden"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </button>
                <h2 className="font-semibold">New message</h2>
              </header>
              <form
                onSubmit={handleSend}
                className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-4 sm:px-7"
              >
                <div className="border-b border-[#303536] py-3 text-sm">
                  <span className="mr-3 text-[#989e9e]">From</span>
                  <span>
                    {
                      accounts.find((account) => account.id === accountId)
                        ?.emailAddress
                    }
                  </span>
                </div>
                <label className="border-b border-[#303536] py-3 text-sm">
                  <span className="mr-3 text-[#989e9e]">To</span>
                  <input
                    type="text"
                    required
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    placeholder="name@example.com"
                    className="w-[calc(100%-48px)] bg-transparent text-[#e5e7e7] outline-none placeholder:text-[#747a7b]"
                  />
                </label>
                <label className="border-b border-[#303536] py-3 text-sm">
                  <span className="mr-3 text-[#989e9e]">Cc</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(event) => setCc(event.target.value)}
                    placeholder="Optional"
                    className="w-[calc(100%-48px)] bg-transparent text-[#e5e7e7] outline-none placeholder:text-[#747a7b]"
                  />
                </label>
                <label className="border-b border-[#303536] py-3 text-sm">
                  <span className="mr-3 text-[#989e9e]">Subject</span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="w-[calc(100%-72px)] bg-transparent text-[#e5e7e7] outline-none"
                  />
                </label>
                <textarea
                  required
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write your message"
                  className="min-h-0 flex-1 resize-none bg-transparent py-5 text-sm leading-6 text-[#e5e7e7] outline-none placeholder:text-[#747a7b]"
                />
                {error && (
                  <p role="alert" className="mb-3 text-sm text-red-300">
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-between border-t border-[#303536] pt-4">
                  <p aria-live="polite" className="text-sm text-[#929898]">
                    {notice}
                  </p>
                  <button
                    type="submit"
                    disabled={sending || !accountId}
                    className="flex h-10 items-center gap-2 rounded-md bg-[#090b0c] px-4 text-sm font-medium text-white hover:bg-[#282d2e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send aria-hidden="true" className="size-4" />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </>
          ) : selectedEmail ? (
            <>
              <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[#303536] px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    aria-label="Back to messages"
                    className="grid size-9 shrink-0 place-items-center rounded-md text-[#c4c8c8] hover:bg-[#242829] md:hidden"
                  >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                  </button>
                  <h2 className="truncate font-semibold">
                    {selectedEmail.subject || "(No subject)"}
                  </h2>
                </div>
                <time
                  className="shrink-0 text-xs text-[#929898]"
                  dateTime={selectedEmail.receivedAt}
                >
                  {selectedEmail.receivedAtLabel}
                </time>
              </header>
              <article className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex items-start gap-3 border-b border-[#303536] px-5 py-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#343a3b] text-sm font-semibold text-[#e5e7e7]">
                    {(selectedEmail.from.name || selectedEmail.from.address)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {selectedEmail.from.name || selectedEmail.from.address}
                    </p>
                    <p className="truncate text-xs text-[#969c9c]">
                      {selectedEmail.from.address}
                    </p>
                    {selectedEmail.to.length > 0 && (
                      <p className="mt-2 text-xs text-[#969c9c]">
                        To:{" "}
                        {selectedEmail.to
                          .map((recipient) => recipient.address)
                          .join(", ")}
                      </p>
                    )}
                    {selectedEmail.cc.length > 0 && (
                      <p className="mt-1 text-xs text-[#969c9c]">
                        Cc:{" "}
                        {selectedEmail.cc
                          .map((recipient) => recipient.address)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mx-auto max-w-4xl whitespace-pre-wrap wrap-break-word px-5 py-5 text-sm leading-7 text-[#d8dada] sm:px-7">
                  {selectedEmail.bodyText ||
                    "(This message has no stored body.)"}
                </div>
              </article>
            </>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-[#929898] md:flex">
              <MousePointer2 aria-hidden="true" className="size-7" />
              <span className="text-sm">No message selected</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
