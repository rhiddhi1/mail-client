import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const POST = async (req: NextRequest) => {
  const { accountID, userId } = await req.json();
  if (!accountID || !userId)
    return NextResponse.json({ error: "missing accountID or userID" });

  const dbAccount = await prisma.account.findUnique({
    where: { id: accountID, userId },
  });

  if (!dbAccount)
    return NextResponse.json({ message: "No account found" }, { status: 400 });

  const emails = await performInitialSync();
  await syncEmailsToDatabase(emails);
};
