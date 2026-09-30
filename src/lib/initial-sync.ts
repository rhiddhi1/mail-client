import { Account } from "@/lib/accounts";
import prisma from "@/lib/prisma";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";

export async function performAccountInitialSync(
  accountID: string,
  accessToken: string,
) {
  const account = new Account(accessToken);
  const { emails, deltaToken } = await account.performInitialSync();

  console.log("Initial sync completed", {
    accountID,
    emailCount: emails.length,
    deltaToken,
  });

  await prisma.account.update({
    where: { id: accountID },
    data: { nextDeltaToken: deltaToken },
  });

  await syncEmailsToDatabase(emails, accountID);

  return emails.length;
}
