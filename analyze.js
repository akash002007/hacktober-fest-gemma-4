import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { parser } from "./parser.js";
import { withRetry } from "./utils/retry.js";
import { searchSimilar } from "./search.js";

const modelName = process.env.MODEL_NAME || "gemma-4-31b-it";

const model = new ChatGoogleGenerativeAI({
  model: modelName,
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.1,
});

const analysisPrompt = PromptTemplate.fromTemplate(`
You are an expert document negotiator and legal/contract analyst.
Analyze the following document based on the user's instructions.

CRITICAL INSTRUCTION:
When filling the 'exact_quote' field in findings, copy text VERBATIM from the document. 
Do not alter punctuation, spacing, or casing.

{format_instructions}

{referenceContext}

User Context / Request: 
{userPrompt}

Document Text:
{documentText}
`);

export async function analyzeDocument(documentText, userPrompt) {
  let referenceContext = "";
  try {
    const similarClauses = await searchSimilar("limitation of liability indemnification termination", 2);
    if (similarClauses && similarClauses.length > 0) {
      referenceContext = `Standard Reference Benchmarks (from Legal Corpus):\n` +
        similarClauses.map((c, i) => `[Standard Benchmark ${i + 1}]: ${c.text}`).join("\n\n");
    }
  } catch (ragError) {
    console.warn("⚠️ Qdrant vector benchmark search unavailable, continuing without RAG context:", ragError.message);
    referenceContext = "Standard Reference Benchmarks: Not available.";
  }

  const chain = analysisPrompt.pipe(model).pipe(parser);

  const response = await withRetry(() =>
    chain.invoke({
      documentText,
      userPrompt: userPrompt || "Analyze this document for potential risks and key clauses.",
      format_instructions: parser.getFormatInstructions(),
      referenceContext,
    })
  );

  return response;
}