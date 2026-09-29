import { email } from "zod";
import { EmailAddress } from "./types";
import plimit from "p-limit";

export async function syncEmailsToDatabase(emails: EmailAddress[]) {
  console.log("attempting to sync emails to database", emails.length);
  const limit = plimit(10);

  try {
    
  } catch (error) {}
}
