"use server";

import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export const getAurinkoAuthURL = async (
  serviceType: "Google" | "Office365",
) => {
  const { userId } = await auth();

  if (!userId) throw new Error("unauthorized");

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error(
      "Set APP_URL or NEXT_PUBLIC_APP_URL to the absolute app URL, such as https://mail.example.com.",
    );
  }

  let returnUrl: string;
  try {
    const url = new URL(appUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
    returnUrl = new URL("/api/aurinko/callback", url).toString();
  } catch {
    throw new Error(
      "APP_URL or NEXT_PUBLIC_APP_URL must be an absolute http:// or https:// URL, such as https://mail.example.com.",
    );
  }

  const params = new URLSearchParams({
    clientId: process.env.AURINKO_CLIENT_ID as string,
    serviceType,
    scopes: "Mail.Read Mail.Send",
    responseType: "code",
    returnUrl,
    state: userId,
  });

  return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
};

export const exchangeCodeForAccessToken = async (code: string) => {
  const clientId = process.env.AURINKO_CLIENT_ID;
  const clientSecret = process.env.AURINKO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Aurinko client credentials");
  }

  try {
    const response = await axios.post(
      `https://api.aurinko.io/v1/auth/token/${code}`,
      null,
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
      },
    );

    return response.data as {
      accountId: number;
      accessToken: string;
      userId: string;
      userSession: string;
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Aurinko access-token exchange failed", {
        status: error.response?.status,
        code: error.response?.data?.code,
        message: error.response?.data?.message,
        requestId: error.response?.data?.requestId,
      });
    } else {
      console.error(
        "Aurinko access-token exchange failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }
};

export const getAccountDetails = async (accessToken: string) => {
  try {
    const response = await axios.get("https://api.aurinko.io/v1/account", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data as {
      name: string;
      email: string;
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Aurinko account lookup failed", {
        status: error.response?.status,
        code: error.response?.data?.code,
        message: error.response?.data?.message,
        requestId: error.response?.data?.requestId,
      });
    } else {
      console.error(
        "Aurinko account lookup failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }
};
