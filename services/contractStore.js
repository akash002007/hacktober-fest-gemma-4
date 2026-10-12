import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT_DIR, "data", "contracts.json");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");

// Ensure data file and uploads directory exist
async function ensureStorage() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Storage initialization error:", err);
  }
}

// Read all contracts from persistence
export async function getAllContracts() {
  await ensureStorage();
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("Error reading contracts:", err);
    return [];
  }
}

// Write all contracts atomically
async function saveAllContracts(contracts) {
  await ensureStorage();
  const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
  await fs.writeFile(tempFile, JSON.stringify(contracts, null, 2), "utf-8");
  await fs.rename(tempFile, DATA_FILE);
}

// Save uploaded buffer to uploads directory
export async function saveUploadedFile(fileBuffer, originalFilename, mimeType) {
  await ensureStorage();
  const contractId = uuidv4();
  const ext = path.extname(originalFilename) || (mimeType.startsWith("image/") ? ".png" : ".pdf");
  const storedFilename = `${contractId}${ext}`;
  const storedPath = path.join(UPLOADS_DIR, storedFilename);

  await fs.writeFile(storedPath, fileBuffer);

  return {
    id: contractId,
    storedFilename,
    storedPath,
    originalFilename,
    fileSize: fileBuffer.length,
    mimeType,
  };
}

// Create a new contract record
export async function createContractRecord({
  id,
  originalFilename,
  storedFilename,
  storedPath,
  fileSize,
  mimeType,
}) {
  const contracts = await getAllContracts();
  const now = new Date().toISOString();

  const newContract = {
    id,
    filename: originalFilename,
    storedFilename,
    storedPath,
    fileSize,
    mimeType,
    createdAt: now,
    updatedAt: now,
    status: "processing", // processing | completed | failed
    error: null,
    activeStep: 1, // 1: uploaded, 2: text extraction, 3: clause identification, 4: risk analysis, 5: recommendations, 6: completed
    executionEvents: [
      {
        id: `evt-${Date.now()}-1`,
        timestamp: new Date().toLocaleTimeString(),
        stage: "Document uploaded",
        message: `Received ${originalFilename} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
        type: "info",
      },
    ],
    generalResponse: null,
    scratchpadSummary: null,
    financialExposure: "Not assessed",
    risks: [],
  };

  contracts.unshift(newContract);
  await saveAllContracts(contracts);
  return newContract;
}

// Retrieve single contract by ID
export async function getContractById(id) {
  const contracts = await getAllContracts();
  return contracts.find((c) => c.id === id) || null;
}

// Add real execution event to contract log
export async function addContractEvent(contractId, stage, message, type = "info") {
  const contracts = await getAllContracts();
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) return null;

  const event = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString(),
    stage,
    message,
    type,
  };

  contract.executionEvents.push(event);
  contract.updatedAt = new Date().toISOString();
  await saveAllContracts(contracts);
  return event;
}

// Update processing step and analysis results
export async function updateContractAnalysis(contractId, updates) {
  const contracts = await getAllContracts();
  const index = contracts.findIndex((c) => c.id === contractId);
  if (index === -1) return null;

  contracts[index] = {
    ...contracts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveAllContracts(contracts);
  return contracts[index];
}

// Update status of an individual risk (pending | accepted | resolved | dismissed)
export async function updateRiskResolution(contractId, riskId, newStatus) {
  const contracts = await getAllContracts();
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) return null;

  const risk = (contract.risks || []).find((r) => r.id === riskId);
  if (!risk) return null;

  risk.resolution_status = newStatus;
  risk.is_accepted = newStatus === "accepted" || newStatus === "resolved";
  risk.updatedAt = new Date().toISOString();

  contract.updatedAt = new Date().toISOString();
  await saveAllContracts(contracts);
  return risk;
}

// List all contracts with aggregated metrics
export async function listRecentContracts() {
  const contracts = await getAllContracts();
  return contracts.map((c) => {
    const risks = c.risks || [];
    const criticalCount = risks.filter((r) => r.risk_level === "critical").length;
    const highCount = risks.filter((r) => r.risk_level === "high").length;
    const mediumCount = risks.filter((r) => r.risk_level === "medium").length;
    const lowCount = risks.filter((r) => r.risk_level === "low").length;
    const resolvedCount = risks.filter((r) => r.is_accepted || r.resolution_status === "resolved" || r.resolution_status === "accepted").length;
    const dismissedCount = risks.filter((r) => r.resolution_status === "dismissed").length;
    const pendingCount = risks.filter((r) => r.resolution_status === "pending" || (!r.resolution_status && !r.is_accepted)).length;

    return {
      id: c.id,
      name: c.filename,
      date: new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      createdAt: c.createdAt,
      status: c.status,
      fileSize: c.fileSize,
      mimeType: c.mimeType,
      totalRisks: risks.length,
      criticalRisks: criticalCount,
      highRisks: highCount,
      mediumRisks: mediumCount,
      lowRisks: lowCount,
      resolvedRisks: resolvedCount,
      pendingRisks: pendingCount,
      dismissedRisks: dismissedCount,
      financialExposure: c.financialExposure || "Not assessed",
      riskSummary: {
        totalIdentified: risks.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        pending: pendingCount,
        resolved: resolvedCount,
        dismissed: dismissedCount,
      },
    };
  });
}

// Delete contract and its associated file
export async function deleteContractById(id) {
  const contracts = await getAllContracts();
  const contract = contracts.find((c) => c.id === id);
  if (!contract) return false;

  if (contract.storedPath) {
    try {
      await fs.unlink(contract.storedPath);
    } catch (e) {
      // Ignore if file doesn't exist
    }
  }

  const remaining = contracts.filter((c) => c.id !== id);
  await saveAllContracts(remaining);
  return true;
}

// Reset workspace
export async function resetWorkspaceStore() {
  await saveAllContracts([]);
  return true;
}
