import OpenAI from "openai";
import { config } from "../config/config.js";
import logger from "../utils/logger.js";
import { PropertyDetail } from "./detailScraper.js";
import { flattenHTML } from "./flatten-thml.js";

// Initialize DeepSeek client
const deepseek = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: "https://api.deepseek.com/v1",
});

const DEFAULT_CRITERIA = `MANDATORY requirements (all must be met):
- Must be in Antwerp city or aera so Berchem, Deurne, Wilrijk, Borgerhout
- If room information is provided, must have at least 2 rooms (or 1 bedroom and a bureau)
- Must cost less than 1300 EUR/month (1,300 or 1300 or 1300.00)
- Must cost more than 950 EUR/month (950 or 950.00)
- If a move-in date is provided, it must be after July 30th, if it is not provided, it is not a problem

OPTIONAL preferences (nice to have, but not required):
- Terrace would be ideal

An apartment matches if it meets ALL mandatory requirements. The terrace is optional.`;

export interface PropertyEvaluation {
  property: PropertyDetail;
  matches: boolean;
  reasoning: string;
}

export async function evaluatePropertyDetail(
  property: PropertyDetail,
  criteria: string = DEFAULT_CRITERIA
): Promise<PropertyEvaluation> {
  try {
    logger.info(`[${property.agency}] Evaluating property: ${property.url}`);

    // Flatten and simplify the HTML
    const flattenedHtml = flattenHTML(property.html);
    logger.info(
      `[${property.agency}] Flattened HTML length: ${flattenedHtml.length}`
    );

    const prompt = `You are analyzing a rental property detail page to determine if it matches the given criteria.

CRITERIA: ${criteria}

AGENCY: ${property.agency}
URL: ${property.url}

TASK: Analyze the flattened HTML content below and determine if this property matches ALL mandatory requirements. Extract all relevant information (price, address, rooms, features, etc.) from the flattened HTML. Be systematic and thorough.

FLATTENED HTML CONTENT:
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
  properties: PropertyDetail[],
  criteria: string = DEFAULT_CRITERIA
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
      const evaluation = await evaluatePropertyDetail(property, criteria);
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
