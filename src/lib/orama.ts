import { create, insert, search, type AnyOrama } from "@orama/orama";
import { getEmbeddings } from "@/lib/embeddings";

export class OramaManager {
  private orama!: AnyOrama;
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
  }

  async initialize() {
    this.orama = await create({
      schema: {
        title: "string",
        body: "string",
        rawBody: "string",
        from: "string",
        to: "string[]",
        sentAt: "string",
        embeddings: "vector[1536]",
        threadId: "string",
      },
    });
  }

  async insert(document: any) {
    if (!this.orama) {
      throw new Error("Orama index is not initialized");
    }

    await insert(this.orama, document);
  }

  async vectorSearch({
    prompt,
    numResults = 10,
  }: {
    prompt: string;
    numResults?: number;
  }) {
    const embeddings = await getEmbeddings(prompt);
    const results = await search(this.orama, {
      mode: "hybrid",
      term: prompt,
      vector: {
        value: embeddings,
        property: "embeddings",
      },
      similarity: 0.8,
      limit: numResults,
    });

    return results;
  }

  async search({ term }: { term: string }) {
    return await search(this.orama, {
      term: term,
    });
  }

  async saveIndex() {
    // The current schema does not persist a binary index in Prisma, so this keeps the
    // in-memory Orama index alive for the current process without crashing the app.
  }
}

// Usage example:
async function main() {
  const oramaManager = new OramaManager("67358");
  await oramaManager.initialize();

  // Insert a document
  // const emails = await db.email.findMany({
  //     where: {
  //         thread: { accountId: '67358' }
  //     },
  //     select: {
  //         subject: true,
  //         bodySnippet: true,
  //         from: { select: { address: true, name: true } },
  //         to: { select: { address: true, name: true } },
  //         sentAt: true,
  //     },
  //     take: 100
  // })
  // await Promise.all(emails.map(async email => {
  //     // const bodyEmbedding = await getEmbeddings(email.bodySnippet || '');
  //     // console.log(bodyEmbedding)
  //     await oramaManager.insert({
  //         title: email.subject,
  //         body: email.bodySnippet,
  //         from: `${email.from.name} <${email.from.address}>`,
  //         to: email.to.map(t => `${t.name} <${t.address}>`),
  //         sentAt: email.sentAt.getTime(),
  //         // bodyEmbedding: bodyEmbedding,
  //     })
  // }))

  // Search
  const searchResults = await oramaManager.search({
    term: "cascading",
  });

  console.log(searchResults.hits.map((hit) => hit.document));
}

// main().catch(console.error);
