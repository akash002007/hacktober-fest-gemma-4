import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { extractTextFromPDF } from "./ingestion.js";
import { analyzeDocument } from "./analyze.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB ceiling
  fileFilter: (req, file, cb) => {
    const isAllowed =
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/") ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (isAllowed) {
      cb(null, true);
    } else {
      const err = new Error("Unsupported file type. Please upload a PDF or an image document.");
      err.status = 400;
      cb(err, false);
    }
  },
});

app.use(cors());
app.use(express.json());

// Main upload and analysis endpoint with multer error interceptor
app.post("/api/analyze", (req, res, next) => {
  upload.single("pdf")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size exceeds 15MB limit." });
      }
      return res.status(400).json({ error: err.message || "Failed to process uploaded file." });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const userPrompt = req.body.prompt || "";
    
    // 1. Extract text from PDF/image buffer
    const documentText = await extractTextFromPDF(req.file.buffer, req.file.mimetype);
    console.log(`[DIAGNOSTIC] documentText.length: ${documentText ? documentText.length : 0}`);
    console.log(`[DIAGNOSTIC] documentText first 300 chars: ${documentText ? documentText.slice(0, 300) : "EMPTY"}`);

    // 2. Run LangChain analysis with Zod validation
    const result = await analyzeDocument(documentText, userPrompt);
    console.log("[DIAGNOSTIC] raw result returned by analyzeDocument():", JSON.stringify(result, null, 2));

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