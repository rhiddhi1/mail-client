import axios from "axios";
import { EmailMessage, SyncResponse, SyncUpdatedResponse } from "./types";

const SYNC_READY_TIMEOUT_MS = 60_000;
const SYNC_POLL_INTERVAL_MS = 1_000;
const REQUEST_TIMEOUT_MS = 15_000;

export class Account {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async startSync() {
    const response = await axios.post<SyncResponse>(
      "https://api.aurinko.io/v1/email/sync",
      {},
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        timeout: REQUEST_TIMEOUT_MS,
        params: {
          daysWithin: 7,
          bodyType: "html",
        },
      },
    );
    return response.data;
  }

  async getUpdatedEmails({
    deltaToken,
    pageToken,
  }: {
    deltaToken?: string;
    pageToken?: string;
  }): Promise<SyncUpdatedResponse> {
    // console.log('getUpdatedEmails', { deltaToken, pageToken });
    let params: Record<string, string> = {};
    if (deltaToken) {
      params.deltaToken = deltaToken;
    }
    if (pageToken) {
      params.pageToken = pageToken;
    }
    const response = await axios.get<SyncUpdatedResponse>(
      "https://api.aurinko.io/v1/email/sync/updated",
      {
        params,
        headers: { Authorization: `Bearer ${this.token}` },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );
    return response.data;
  }

  async performInitialSync() {
    let syncResponse = await this.startSync();
    const deadline = Date.now() + SYNC_READY_TIMEOUT_MS;

    while (!syncResponse.ready) {
      const remainingTime = deadline - Date.now();
      if (remainingTime <= 0) {
        throw new Error(
          "Timed out waiting for Aurinko initial sync to become ready",
        );
      }

      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(SYNC_POLL_INTERVAL_MS, remainingTime)),
      );
      syncResponse = await this.startSync();
    }

    let storedDeltaToken = syncResponse.syncUpdatedToken;

    let updatedResponse = await this.getUpdatedEmails({
      deltaToken: storedDeltaToken,
    });

    if (updatedResponse.nextDeltaToken) {
      storedDeltaToken = updatedResponse.nextDeltaToken;
    }

    let allEmails: EmailMessage[] = updatedResponse.records;

    while (updatedResponse.nextPageToken) {
      updatedResponse = await this.getUpdatedEmails({
        pageToken: updatedResponse.nextPageToken,
      });
      allEmails = allEmails.concat(updatedResponse.records);
      if (updatedResponse.nextDeltaToken) {
        storedDeltaToken = updatedResponse.nextDeltaToken;
      }
    }

    return {
      emails: allEmails,
      deltaToken: storedDeltaToken,
    };
  }
}
