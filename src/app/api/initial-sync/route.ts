import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Account } from "@/lib/accounts";
import axios from "axios";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";

export const POST = async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { accountID, userId } = body as {
    accountID?: unknown;
    userId?: unknown;
  };
  if (typeof accountID !== "string" || typeof userId !== "string") {
    return NextResponse.json(
      { error: "accountID and userId are required" },
      { status: 400 },
    );
  }

  const dbAccount = await prisma.account.findUnique({
    where: { id: accountID, userId },
  });

  if (!dbAccount)
    return NextResponse.json({ message: "No account found" }, { status: 404 });

  const account = new Account(dbAccount.accessToken);

  try {
    const { emails, deltaToken } = await account.performInitialSync();
    console.log("Initial sync completed", {
      accountID,
      emailCount: emails.length,
      deltaToken,
    });

    //   await prisma.account.update({
    //     where: { id: accountID },
    //     data: { nextDeltaToken: deltaToken },
    //   });

    await syncEmailsToDatabase(emails);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Initial sync failed", {
        accountID,
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
    } else {
      console.error("Initial sync failed", {
        accountID,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json({ error: "Initial sync failed" }, { status: 502 });
  }
};
