// ============================================================================
// search.js — ContractLens AI: Filtered Vector Similarity Search
// ============================================================================
// Responsibilities:
//   1. Generate a query embedding for the input clause text.
//   2. Perform a filtered vector search against Qdrant, constrained to
//      `contractType: "standard_corpus"` so user-uploaded contracts are
//      never compared against themselves — only against baseline standards.
//   3. Return structured results: { score, text, documentId }[].
//
// Why the filter matters:
//   Without it, the system would retrieve the user's own predatory clause as
//   the top match (score ≈ 1.0), producing a meaningless self-comparison.
//   The filter enforces that risk analysis is always grounded against known
//   good reference agreements.
// ============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

// ── Client Initialization ───────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "contractlens";

// ── Similarity Search ───────────────────────────────────────────────────────

export async function searchSimilar(clauseText, topK = 3) {
  console.log(`🔍 Searching for top ${topK} similar standard clauses…`);

  // Step 1 — Embed the query clause
  const result = await embeddingModel.embedContent(clauseText);
  const queryVector = result.embedding.values;

  // Step 2 — Vector search with payload filter
  // The `must` filter ensures we ONLY retrieve chunks tagged as
  // "standard_corpus", preventing self-referential matches when the
  // user's own uploaded contract is also in the collection.
  const searchResult = await qdrant.search(COLLECTION_NAME, {
    vector: queryVector,
    limit: topK,
    with_payload: true,
    filter: {
      must: [
        {
          key: "contractType",
          match: { value: "standard_corpus" },
        },
      ],
    },
  });

  // Step 3 — Map to clean response objects
  const results = searchResult.map((hit) => ({
    score: hit.score,
    text: hit.payload.text,
    documentId: hit.payload.documentId,
  }));

  console.log(`✅ Retrieved ${results.length} reference chunk(s).\n`);
  return results;
}
