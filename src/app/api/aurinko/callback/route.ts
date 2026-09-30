import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko";
import { performAccountInitialSync } from "@/lib/initial-sync";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import axios from "axios";

export const GET = async (req: NextRequest) => {
  const { userId } = await auth();

  if (!userId)
    return NextResponse.json({ message: "Unauthorized" }, { status: 400 });

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  if (status != "success")
    return NextResponse.json(
      { message: "Failed to link account" },
      { status: 400 },
    );

  const code = params.get("code");

  if (!code)
    return NextResponse.json({ message: "No code provided" }, { status: 400 });

  const token = await exchangeCodeForAccessToken(code);

  if (!token)
    return NextResponse.json(
      {
        message: "Failed to exchange code for access token",
      },
      { status: 400 },
    );

  const accountDetails = await getAccountDetails(token.accessToken);

  if (!accountDetails)
    return NextResponse.json(
      { message: "Failed to retrieve account details" },
      { status: 502 },
    );

  await prisma.account.upsert({
    where: { id: token.accountId.toString() },
    update: { accessToken: token.accessToken },
    create: {
      id: token.accountId.toString(),
      userId,
      accessToken: token.accessToken,
      emailAddress: accountDetails.email,
      name: accountDetails.name,
    },
  });

  waitUntil(
    performAccountInitialSync(
      token.accountId.toString(),
      token.accessToken,
    ).catch((error: unknown) => {
      if (axios.isAxiosError(error)) {
        console.error("Failed to run initial sync", {
          message: error.message,
          status: error.response?.status,
          code: error.response?.data?.code,
          responseMessage: error.response?.data?.message,
        });
      } else {
        console.error(
          "Failed to run initial sync",
          error instanceof Error ? error.message : String(error),
        );
      }
    }),
  );

  return NextResponse.redirect(new URL("/mail", req.url));
};
