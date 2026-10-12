import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

// The Zod schema tailored to your React/Frontend UI layout
export const documentAnalysisSchema = z.object({
  scratchpad_summary: z
    .string()
    .describe("A brief, 1-2 sentence overview of what the AI is analyzing to display in the right-side scratchpad."),
  
  general_response: z
    .string()
    .describe("The main introductory chat response summarizing the overall document."),
  
  findings: z
    .array(
      z.object({
        index: z.number().describe("A unique sequential index number for this specific highlight (1, 2, 3...)."),
        severity_color: z.enum(["red", "orange", "yellow"]).describe("red for critical issues, orange for warnings, yellow for minor notes."),
        exact_quote: z.string().describe("The exact text snippet from the provided document that needs to be highlighted."),
        ai_response: z.string().describe("The AI's specific solution, counter-argument, or negotiation tactic for this highlighted section.")
      })
    )
    .describe("A list of flagged sections within the document that require the user's attention."),
});

// Export the parser to be used in your LangChain pipeline
export const parser = StructuredOutputParser.fromZodSchema(documentAnalysisSchema);