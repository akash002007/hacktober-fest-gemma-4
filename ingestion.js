import { createRequire } from "module";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParseRaw = require("pdf-parse");

/**
 * Fallback visual OCR extraction for scanned notices, documents, or photos
 * using Gemma 4 / Gemini API multimodal capabilities.
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
export async function processImageNotice(imageBuffer, mimeType = "application/pdf") {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.MODEL_NAME || "gemma-4-31b-it";
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt =
      "You are an expert OCR and legal document transcription engine. " +
      "Extract and transcribe all text verbatim from this legal notice / contract document. " +
      "Maintain exact numbers, sections, party names, covenants, and dates. " +
      "Output the clean extracted text directly without conversational commentary.";

    const inlineData = {
      inlineData: {
        data: Buffer.from(imageBuffer).toString("base64"),
        mimeType: mimeType || "application/pdf",
      },
    };

    console.log(`🤖 Invoking ${modelName} for visual multimodal OCR (${mimeType})...`);
    const result = await model.generateContent([prompt, inlineData]);
    const response = await result.response;
    const extractedText = response.text();

    console.log(`✅ Visual OCR extraction completed (${extractedText.length} characters).`);
    return extractedText;
  } catch (ocrError) {
    console.error("❌ Visual OCR extraction failed:", ocrError.message);
    throw ocrError;
  }
}

/**
 * Extracts raw text from a PDF Buffer with automatic visual OCR fallback
 * @param {Buffer} pdfBuffer 
 * @param {string} [mimeType="application/pdf"]
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(pdfBuffer, mimeType = "application/pdf") {
  // If input is an image (PNG, JPEG, WebP) rather than a PDF, route directly to multimodal OCR
  if (mimeType && mimeType.startsWith("image/")) {
    console.log(`📸 Image document detected (${mimeType}). Routing to visual OCR...`);
    return await processImageNotice(pdfBuffer, mimeType);
  }

  try {
    let extractedText = "";

    // 1. Handle older versions of pdf-parse (Exports a direct function)
    if (typeof pdfParseRaw === "function") {
      const data = await pdfParseRaw(pdfBuffer);
      extractedText = data.text;
    } 
    // 2. Handle newer version 2.0+ (Exports an object with a PDFParse class)
    else if (pdfParseRaw && typeof pdfParseRaw.PDFParse !== "undefined") {
      // Modern Node requires converting the raw buffer to Uint8Array for v2
      const parser = new pdfParseRaw.PDFParse({ data: new Uint8Array(pdfBuffer) });
      const result = await parser.getText();
      extractedText = result.text;
    } 
    // 3. Handle random ES Module bundler weirdness (Hidden .default export)
    else if (pdfParseRaw && typeof pdfParseRaw.default === "function") {
      const data = await pdfParseRaw.default(pdfBuffer);
      extractedText = data.text;
    } 
    // 4. Fallback: Log module structure and attempt visual OCR
    else {
      console.warn("Could not initialize pdf-parse module. Falling back to Gemma 4 visual OCR...");
      return await processImageNotice(pdfBuffer, "application/pdf");
    }

    // Check if extracted text is empty or purely whitespace (scanned/image-only PDF)
    if (!extractedText || extractedText.trim().length < 20) {
      console.log("⚠️ Extracted text is empty or minimal (< 20 characters). Falling back to Gemma 4 visual OCR...");
      extractedText = await processImageNotice(pdfBuffer, "application/pdf");
    }

    // Diagnostic check
    console.log("\n--- EXTRACTED PDF TEXT START ---");
    console.log(extractedText?.slice(0, 300) + (extractedText?.length > 300 ? "..." : ""));
    console.log("--- EXTRACTED PDF TEXT END ---\n");

    return extractedText;
  } catch (error) {
    console.warn("⚠️ Standard PDF text extraction failed:", error.message, "- Trying visual OCR fallback with Gemma 4...");
    try {
      const ocrText = await processImageNotice(pdfBuffer, "application/pdf");
      if (ocrText && ocrText.trim().length > 0) {
        return ocrText;
      }
    } catch (fallbackError) {
      console.error("Gemma 4 visual OCR fallback failed:", fallbackError.message);
    }
    throw new Error("Failed to extract text from PDF document: " + error.message);
  }
}