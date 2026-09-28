"use server";

import { auth } from "@clerk/nextjs/server";

export const getAurinkoAuthURL = async (
  serviceType: "Google" | "Office365",
) => {
  const { userId } = await auth();

  if (!userId) throw new Error("unauthorized");

  const params = new URLSearchParams({
    clientId: process.env.AURINKO_CLIENT_ID as string,
    serviceType,
    scopes: "Mail.Read Mail.Send",
    responseType: "code",
    returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
    state: userId,
  });

  return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
};
