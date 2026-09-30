import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import axios from "axios";
import { NextResponse } from "next/server";
import { z } from "zod";

const sendMailSchema = z.object({
  accountId: z.string().min(1),
  to: z.array(z.string().trim().email()).min(1).max(10),
  cc: z.array(z.string().trim().email()).max(10).default([]),
  subject: z.string().trim().max(998),
  body: z.string().trim().min(1).max(100_000),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = sendMailSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the email fields" },
      { status: 400 },
    );
  }

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId },
    select: {
      id: true,
      name: true,
      emailAddress: true,
      accessToken: true,
    },
  });

  if (!account) {
    return NextResponse.json(
      { error: "Mail account not found" },
      { status: 404 },
    );
  }

  try {
    const response = await axios.post<{
      id?: string;
      threadId?: string;
      processingStatus?: string;
      processingError?: { errorMessage?: string };
    }>(
      "https://api.aurinko.io/v1/email/messages",
      {
        from: { name: account.name, address: account.emailAddress },
        to: parsed.data.to.map((address) => ({ address })),
        cc: parsed.data.cc.map((address) => ({ address })),
        subject: parsed.data.subject,
        body: parsed.data.body,
      },
      {
        params: { bodyType: "text", returnIds: true },
        headers: { Authorization: `Bearer ${account.accessToken}` },
        timeout: 20_000,
      },
    );

    if (
      response.data.processingStatus &&
      response.data.processingStatus !== "Ok"
    ) {
      return NextResponse.json(
        {
          error:
            response.data.processingError?.errorMessage ??
            "The mail provider could not send this message",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ sent: true, id: response.data.id ?? null });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Aurinko send failed", {
        status: error.response?.status,
        message: error.message,
      });
    }

    return NextResponse.json(
      { error: "Unable to send email" },
      { status: 502 },
    );
  }
}
