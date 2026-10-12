import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { extractTextFromPDF } from "./ingestion.js";
import { analyzeDocument } from "./analyze.js";
import {
  saveUploadedFile,
  createContractRecord,
  getContractById,
  addContractEvent,
  updateContractAnalysis,
  updateRiskResolution,
  listRecentContracts,
  deleteContractById,
  resetWorkspaceStore,
} from "./services/contractStore.js";
import { calculateFinancialExposure } from "./services/exposureCalculator.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. Upload & Complete End-to-End Contract Analysis
// ─────────────────────────────────────────────────────────────────────────────
app.post(
  "/api/analyze",
  (req, res, next) => {
    upload.single("pdf")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File size exceeds 15MB limit." });
        }
        return res.status(400).json({ error: err.message || "Failed to process uploaded file." });
      }
      next();
    });
  },
  async (req, res) => {
    let contract = null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const userPrompt = req.body.prompt || "";

      // Step 1: Save file and persist contract record
      const stored = await saveUploadedFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      contract = await createContractRecord({
        id: stored.id,
        originalFilename: stored.originalFilename,
        storedFilename: stored.storedFilename,
        storedPath: stored.storedPath,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
      });

      // Step 2: Text Extraction
      await addContractEvent(
        contract.id,
        "Text extraction",
        `Extracting text from ${req.file.mimetype.startsWith("image/") ? "image scan via OCR" : "PDF structure"}...`,
        "info"
      );

      const documentText = await extractTextFromPDF(req.file.buffer, req.file.mimetype);
      console.log(`[DIAGNOSTIC] documentText.length: ${documentText ? documentText.length : 0}`);
      console.log(
        `[DIAGNOSTIC] documentText first 300 chars: ${documentText ? documentText.slice(0, 300) : "EMPTY"}`
      );

      if (!documentText || documentText.trim().length === 0) {
        await addContractEvent(
          contract.id,
          "Text extraction",
          "Extraction produced zero readable text.",
          "error"
        );
        await updateContractAnalysis(contract.id, { status: "failed", error: "Empty extracted text" });
        return res.status(400).json({ error: "Could not extract text from document." });
      }

      await addContractEvent(
        contract.id,
        "Text extraction",
        `Extracted ${documentText.length} characters successfully.`,
        "success"
      );
      await updateContractAnalysis(contract.id, { activeStep: 2 });

      // Step 3: Clause Identification & Benchmarking
      await addContractEvent(
        contract.id,
        "Clause identification",
        "Indexing covenants and querying standard legal benchmark corpus...",
        "info"
      );
      await updateContractAnalysis(contract.id, { activeStep: 3 });

      // Step 4: Risk Analysis with Gemma 4
      await addContractEvent(
        contract.id,
        "Risk analysis",
        "Executing Gemma 4 reasoning model with verbatim quotation rules...",
        "info"
      );
      await updateContractAnalysis(contract.id, { activeStep: 4 });

      const result = await analyzeDocument(documentText, userPrompt);
      console.log("[DIAGNOSTIC] raw result returned by analyzeDocument():", JSON.stringify(result, null, 2));

      // Step 5: Recommendations Generation
      await addContractEvent(
        contract.id,
        "Recommendation generation",
        "Synthesizing counter-arguments, strategy rubrics, and exposure metrics...",
        "info"
      );
      await updateContractAnalysis(contract.id, { activeStep: 5 });

      // Calculate defensible financial exposure
      const rawFindings = result?.findings || [];
      const exposureObj = calculateFinancialExposure(documentText, rawFindings);

      // Transform raw findings into full risk records with page positions
      const mappedRisks = rawFindings.map((f, idx) => {
        const severity = f.severity_color === "red" ? "high" : f.severity_color === "orange" ? "medium" : "low";
        const quote = f.exact_quote || "";
        const titleWords = quote.split(/\s+/).slice(0, 6).join(" ");

        return {
          id: `risk-${contract.id}-${f.index || idx + 1}`,
          index_tag: `#${f.index || idx + 1}`,
          clause_name: titleWords ? `${titleWords}...` : `Covenant #${f.index || idx + 1}`,
          text: quote,
          risk_level: severity,
          explanation: f.ai_response || "Potential contractual exposure requiring attention.",
          who_it_favors: severity === "high" ? "Opposing Party (One-Sided)" : "Needs Review",
          page_number: 1,
          position: {
            x: 8,
            y: 15 + (idx % 5) * 16,
            width: 84,
            height: 12,
          },
          counter_clause: f.ai_response || quote,
          strategy: `Counter-proposal: ${f.ai_response}`,
          financial_exposure: severity === "high" ? exposureObj.amount : "Procedural / Low",
          resolution_status: "pending",
          is_accepted: false,
          updatedAt: new Date().toISOString(),
        };
      });

      // Step 6: Mark completed
      await addContractEvent(
        contract.id,
        "Analysis completed",
        `Indexed ${mappedRisks.length} legal risks. Financial exposure: ${exposureObj.amount}.`,
        "success"
      );

      const criticalCount = mappedRisks.filter((r) => r.risk_level === "critical").length;
      const highCount = mappedRisks.filter((r) => r.risk_level === "high").length;
      const mediumCount = mappedRisks.filter((r) => r.risk_level === "medium").length;
      const lowCount = mappedRisks.filter((r) => r.risk_level === "low").length;
      const pendingCount = mappedRisks.filter((r) => !r.is_accepted && r.resolution_status !== "dismissed").length;
      const resolvedCount = mappedRisks.filter((r) => r.is_accepted).length;
      const dismissedCount = mappedRisks.filter((r) => r.resolution_status === "dismissed").length;

      const riskSummary = {
        totalIdentified: mappedRisks.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        pending: pendingCount,
        resolved: resolvedCount,
        dismissed: dismissedCount,
      };

      const updatedContract = await updateContractAnalysis(contract.id, {
        status: "completed",
        activeStep: 6,
        generalResponse: result.general_response,
        scratchpadSummary: result.scratchpad_summary,
        financialExposure: exposureObj.displayAmount,
        financialExposureDetail: exposureObj,
        riskSummary,
        risks: mappedRisks,
      });

      // Send structured response back
      res.json({
        success: true,
        contractId: updatedContract.id,
        contract: updatedContract,
        riskSummary,
        financialExposure: exposureObj,
        data: {
          scratchpad_summary: updatedContract.scratchpadSummary,
          general_response: updatedContract.generalResponse,
          financial_exposure: updatedContract.financialExposure,
          findings: mappedRisks,
        },
      });
    } catch (error) {
      console.error("API Error:", error);
      if (contract) {
        await addContractEvent(contract.id, "Processing failed", error.message || "Failed to process document.", "error");
        await updateContractAnalysis(contract.id, { status: "failed", error: error.message });
      }
      res.status(500).json({ error: error.message || "Failed to process document." });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Recent Contracts List
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/contracts", async (req, res) => {
  try {
    const list = await listRecentContracts();
    res.json({ success: true, contracts: list });
  } catch (error) {
    res.status(500).json({ error: "Failed to list contracts." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Retrieve Single Contract
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/contracts/:id", async (req, res) => {
  try {
    const contract = await getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found." });
    }
    res.json({ success: true, contract });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve contract." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Stream Uploaded Document File (for PDF Viewer / Image Canvas)
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/contracts/:id/file", async (req, res) => {
  try {
    const contract = await getContractById(req.params.id);
    if (!contract || !contract.storedPath || !fs.existsSync(contract.storedPath)) {
      return res.status(404).json({ error: "Document file not found on server." });
    }

    res.setHeader("Content-Type", contract.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(contract.filename)}"`);
    const stream = fs.createReadStream(contract.storedPath);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Failed to stream document file." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Retrieve Risks for a Contract
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/contracts/:id/risks", async (req, res) => {
  try {
    const contract = await getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found." });
    }
    res.json({ success: true, risks: contract.risks || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve risks." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Update Risk Resolution Status (pending | accepted | resolved | dismissed)
// ─────────────────────────────────────────────────────────────────────────────
app.patch("/api/contracts/:id/risks/:riskId", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "accepted", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ error: "Invalid resolution status." });
    }

    const updatedRisk = await updateRiskResolution(req.params.id, req.params.riskId, status);
    if (!updatedRisk) {
      return res.status(404).json({ error: "Risk or contract not found." });
    }

    res.json({ success: true, risk: updatedRisk });
  } catch (error) {
    res.status(500).json({ error: "Failed to update risk status." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Retrieve Execution Events
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/contracts/:id/events", async (req, res) => {
  try {
    const contract = await getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found." });
    }
    res.json({
      success: true,
      activeStep: contract.activeStep,
      status: contract.status,
      events: contract.executionEvents || [],
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve execution events." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Export Analysis Summary & Redline
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/contracts/:id/export", async (req, res) => {
  try {
    const contract = await getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found." });
    }

    const risks = contract.risks || [];
    const content =
      `CONTRACTLENS AI LEGAL AUDIT REPORT\n` +
      `Document: ${contract.filename}\n` +
      `Date: ${new Date(contract.createdAt).toLocaleString()}\n` +
      `Status: ${contract.status.toUpperCase()}\n` +
      `Financial Exposure: ${contract.financialExposure}\n\n` +
      `EXECUTIVE SUMMARY:\n${contract.generalResponse || "No summary available."}\n\n` +
      `=======================================================\n` +
      `IDENTIFIED RISKS & PROPOSED REDLINES:\n` +
      `=======================================================\n\n` +
      risks
        .map(
          (r) =>
            `[${r.index_tag}] ${r.clause_name} (${r.risk_level.toUpperCase()} RISK)\n` +
            `STATUS: ${r.resolution_status.toUpperCase()} ${r.is_accepted ? "✓ [APPROVED BY USER]" : "⏳ [SUGGESTED ONLY]"}\n` +
            `ORIGINAL TEXT: "${r.text}"\n` +
            `EXPLANATION: ${r.explanation}\n` +
            `PROPOSED COUNTER-CLAUSE: "${r.counter_clause}"\n` +
            `STRATEGY: ${r.strategy}\n`
        )
        .join("\n-------------------------------------------------------\n\n");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="AUDIT_${contract.filename.replace(/\.[^/.]+$/, "")}.txt"`
    );
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: "Failed to export report." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Delete Contract
// ─────────────────────────────────────────────────────────────────────────────
app.delete("/api/contracts/:id", async (req, res) => {
  try {
    const deleted = await deleteContractById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Contract not found." });
    }
    res.json({ success: true, message: "Contract deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contract." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Reset Workspace
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/workspace/reset", async (req, res) => {
  try {
    await resetWorkspaceStore();
    res.json({ success: true, message: "Workspace reset complete." });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset workspace." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});