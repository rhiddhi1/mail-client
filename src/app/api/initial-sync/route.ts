import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { performAccountInitialSync } from "@/lib/initial-sync";

export const POST = async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { accountID } = body as {
    accountID?: unknown;
  };
  if (typeof accountID !== "string") {
    return NextResponse.json(
      { error: "accountID is required" },
      { status: 400 },
    );
  }

  const dbAccount = await prisma.account.findUnique({
    where: { id: accountID, userId },
  });

  if (!dbAccount)
    return NextResponse.json({ message: "No account found" }, { status: 404 });

  try {
    await performAccountInitialSync(accountID, dbAccount.accessToken);

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
