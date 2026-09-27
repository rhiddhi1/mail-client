import "dotenv/config";

import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";

export const corsair = createCorsair({
  kek: process.env.CORSAIR_KEK!,
  // database: db, // your app's database instance
  hub: {
    projectApiKey: process.env.CORSAIR_API_KEY!,
    signingSecret: process.env.CORSAIR_SIGNING_SECRET!,
  },
  plugins: [gmail()],
});
