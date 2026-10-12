// ============================================================================
// utils/retry.js — ContractLens AI: Universal Exponential Backoff Retry
// ============================================================================
// A generic retry wrapper for any async function. Handles transient failures
// (429 Rate Limit, 503 Service Unavailable) with exponential backoff.
//
// Usage:
//   import { withRetry } from "./utils/retry.js";
//   const result = await withRetry(() => someAsyncCall(), 3);
//
// This utility is intentionally decoupled from any specific SDK so it can
// wrap Gemini calls, Qdrant operations, or any future HTTP dependency.
// ============================================================================

/**
 * Retries an async function with exponential backoff on transient errors.
 *
 * @param {Function} asyncFn    — Zero-argument async function to execute.
 * @param {number}   maxRetries — Maximum number of attempts (default: 3).
 * @returns {Promise<*>}        — Resolved value from asyncFn on success.
 * @throws {Error}              — Rethrows non-transient errors immediately,
 *                                 or the final transient error after exhausting retries.
 */
export async function withRetry(asyncFn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      const isTransient =
        error?.status === 429 ||
        error?.status === 503 ||
        error?.message?.includes("429") ||
        error?.message?.includes("503") ||
        error?.message?.toLowerCase().includes("resource exhausted") ||
        error?.message?.toLowerCase().includes("service unavailable");

      if (isTransient && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s …
        console.warn(
          `⚠️  Transient error (attempt ${attempt}/${maxRetries}). ` +
            `Retrying in ${delay / 1000}s… [${error.message}]`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Non-transient error OR final retry exhausted — propagate up
        console.error(
          `❌ Operation failed after ${attempt} attempt(s): ${error.message}`
        );
        throw error;
      }
    }
  }
}
