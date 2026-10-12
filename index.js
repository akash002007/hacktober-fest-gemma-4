import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { extractTextFromPDF } from "./ingestion.js";
import { analyzeDocument } from "./analyze.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Main upload and analysis endpoint
app.post("/api/analyze", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    const userPrompt = req.body.prompt || "";
    
    // 1. Extract text from PDF/image buffer
    const documentText = await extractTextFromPDF(req.file.buffer, req.file.mimetype);

    // 2. Run LangChain analysis with Zod validation
    const result = await analyzeDocument(documentText, userPrompt);

    // 3. Send structured response back to frontend
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message || "Failed to process document." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});