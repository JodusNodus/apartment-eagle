import OpenAI from "openai";
import { config } from "../config/config.js";
import logger from "../utils/logger.js";
import { PropertyDetail } from "./detailScraper.js";
import { flattenHTML } from "./flatten-thml.js";
import fs from "fs-extra";
import path from "path";

// Initialize DeepSeek client
const deepseek = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: "https://api.deepseek.com/v1",
});

// Function to load criteria from file
async function loadCriteriaFromFile(): Promise<string> {
  try {
    const criteriaPath = path.join(process.cwd(), "CRITERIA.md");
    const criteria = await fs.readFile(criteriaPath, "utf-8");
    return criteria;
  } catch (error) {
    logger.warn("Could not load CRITERIA.md, using default criteria");
    throw error;
  }
}

// Cache for criteria to avoid reading file multiple times
let cachedCriteria: string | null = null;

async function getCriteria(): Promise<string> {
  if (!cachedCriteria) {
    cachedCriteria = await loadCriteriaFromFile();
  }
  return cachedCriteria;
}

export interface PropertyEvaluation {
  property: PropertyDetail;
  matches: boolean;
  reasoning: string;
}

export async function evaluatePropertyDetail(
  property: PropertyDetail
): Promise<PropertyEvaluation> {
  try {
    logger.info(`[${property.agency}] Evaluating property: ${property.url}`);

    // Use provided criteria or load from file
    const evaluationCriteria = await getCriteria();

    // Flatten and simplify the HTML
    const flattenedHtml = flattenHTML(property.html);
    logger.info(
      `[${property.agency}] Flattened HTML length: ${flattenedHtml.length}`
    );

    const prompt = `You are analyzing a rental property detail page to determine if it matches the given criteria.

INPUT CRITERIA: ${evaluationCriteria}

TASK: Analyze the flattened HTML content below and determine if this property matches ALL mandatory requirements. Extract all relevant information (price, address, rooms, features, etc.) from the flattened HTML. Be systematic and thorough.

INPUT FLATTENED HTML CONTENT:
${flattenedHtml}

RESPONSE FORMAT:
Return a JSON object with:
{
  "matches": true/false,
  "reasoning": "Brief explanation of why it matches or doesn't match",
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no code blocks, no additional text.`;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      throw new Error("No response from DeepSeek");
    }

    try {
      let jsonContent = content;
      // Handle markdown-formatted JSON responses
      if (content.includes("```json")) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        }
      } else if (content.includes("```")) {
        // Handle other markdown code blocks
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonContent = codeMatch[1].trim();
        }
      }
      const evaluation: PropertyEvaluation = JSON.parse(jsonContent);
      evaluation.property = property;

      logger.info(
        `[${property.agency}] Property evaluation: ${
          evaluation.matches ? "MATCHES" : "NO MATCH"
        } - ${evaluation.reasoning}`
      );

      return evaluation;
    } catch (parseError) {
      logger.error(
        `[${property.agency}] Failed to parse evaluation response: ${parseError}`
      );
      return {
        property,
        matches: false,
        reasoning: "Failed to parse AI evaluation response",
      };
    }
  } catch (error: any) {
    logger.error(
      `[${property.agency}] Error evaluating property: ${error.message}`
    );
    return {
      property,
      matches: false,
      reasoning: `Error during evaluation: ${error.message}`,
    };
  }
}

export async function evaluateAllProperties(
  properties: PropertyDetail[]
): Promise<PropertyEvaluation[]> {
  if (properties.length === 0) {
    return [];
  }

  logger.info(`Evaluating ${properties.length} properties`);

  // Evaluate properties in parallel with rate limiting
  const evaluations: PropertyEvaluation[] = [];

  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    try {
      const evaluation = await evaluatePropertyDetail(property);
      evaluations.push(evaluation);

      // Add a small delay between evaluations to avoid rate limiting
      if (i < properties.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      logger.error(
        `Failed to evaluate property ${property.url}: ${error.message}`
      );
      evaluations.push({
        property,
        matches: false,
        reasoning: `Evaluation failed: ${error.message}`,
      });
    }
  }

  const matchingProperties = evaluations.filter((e) => e.matches);
  logger.info(
    `Found ${matchingProperties.length} matching properties out of ${properties.length} total`
  );

  return evaluations;
}
