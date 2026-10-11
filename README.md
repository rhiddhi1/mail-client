# Mailroom

Mailroom is a fast, personal inbox client for Gmail and Microsoft 365 built with Next.js. It authenticates users with Clerk, connects each account through Aurinko, stores synced messages in PostgreSQL with Prisma, and presents a focused, inbox-first UI for reading, searching, and sending mail.

## Why this project exists

The app is designed to feel like a calmer email workspace: a single place to connect personal email accounts, review recent messages, browse by folder or category, and send quick replies without the clutter of a traditional consumer inbox.

## Features

- Account authentication with Clerk
- Gmail / Office 365 connection flow via Aurinko OAuth
- PostgreSQL-backed email storage through Prisma
- Inbox sync and refresh from connected accounts
- Mailbox UI with account switching, folder navigation, search, and unread filtering
- Compose and send flow for connected mail accounts
- AI-ready embeddings integration for semantic search and future inbox intelligence

## Tech stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS for styling
- Clerk for authentication
- Prisma ORM with PostgreSQL
- Aurinko API for email connectivity
- OpenAI embeddings for AI search preparation

## Project structure

```text
.
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets
├── scripts/                # Project helper scripts
├── src/
│   ├── app/                # App Router pages, routes, and UI
│   ├── components/         # Reusable UI pieces
│   ├── hooks/              # React hooks
│   ├── lib/                # Prisma, auth, sync, and integration helpers
│   └── proxy.ts            # Proxy utilities
├── .env.local              # Local environment config (not committed)
├── next.config.ts          # Next.js config
├── package.json            # Scripts and dependencies
├── pnpm-lock.yaml          # lockfile
├── tsconfig.json           # TypeScript config
└── README.md
```

## Prerequisites

- Node.js 20+
- pnpm
- A PostgreSQL database
- Clerk account and application keys
- Aurinko client credentials
- OpenAI API key (for embeddings support)

## Getting started

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env.local` file in the project root and add the required environment variables:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Database
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require

# Aurinko
AURINKO_CLIENT_ID=your_aurinko_client_id
AURINKO_CLIENT_SECRET=your_aurinko_client_secret
AURINKO_SIGNING_SECRET=your_aurinko_signing_secret
NEXT_PUBLIC_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

3. Generate the Prisma client and apply the schema:

```bash
pnpm prisma generate
pnpm prisma migrate deploy
```

4. Start the development server:

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

## Available scripts

```bash
pnpm dev      # run the app in development mode
pnpm build    # production build
pnpm start    # run the production server
pnpm lint     # eslint validation
```

## Authentication and email flow

- Users sign in with Clerk.
- A signed-in user can connect a Gmail or Office 365 account through Aurinko OAuth.
- The app stores the returned access token and account metadata in PostgreSQL.
- The mailbox page fetches synced email records and renders them in a folder-based view.
- Users can refresh the inbox, search local mail, and compose/send messages through the connected provider.

## Database notes

This project uses Prisma with a PostgreSQL datasource. The schema is defined in `prisma/schema.prisma` and migrations live under `prisma/migrations`.

## Deployment

This app is intended to run as a standard Next.js application and can be deployed to platforms such as Vercel. Ensure the same environment variables are provided in your deployment environment.

## Contributing

Contributions are welcome. If you plan to change auth, email sync, or database models, make sure you update the Prisma schema and run the appropriate migrations before shipping.

## License

This project is currently unlicensed unless otherwise stated in the repository.
