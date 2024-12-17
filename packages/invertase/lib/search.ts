import * as dotenv from "dotenv"
import { MeiliSearch } from "meilisearch"

dotenv.config()

const MEILISEARCH_URL = process.env.MEILISEARCH_URL || "http://localhost:7700"
const MEILISEARCH_MASTER_KEY = process.env.MEILISEARCH_MASTER_KEY || "secure"

export const meili = new MeiliSearch({
  host: MEILISEARCH_URL,
  apiKey: MEILISEARCH_MASTER_KEY,
})
