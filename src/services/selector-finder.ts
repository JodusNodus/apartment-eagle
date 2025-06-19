import OpenAI from "openai";
import * as cheerio from "cheerio";
import { config } from "../config/config.js";
import logger from "../utils/logger.js";

// Initialize DeepSeek client
const deepseek = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: "https://api.deepseek.com/v1",
});

function extractSelectorFromResponse(response: string): string | null {
  // Try to extract just the CSS selector from the response
  const lines = response.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines that start with a CSS selector
    if (
      trimmed.startsWith(".") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("[") ||
      trimmed === "body"
    ) {
      return trimmed;
    }
    // Look for selectors in backticks
    const match = trimmed.match(/`([^`]+)`/);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export async function findSelectorsWithAI(
  html: string,
  agencyName: string
): Promise<string | null> {
  try {
    // Get a larger sample of the HTML, focusing on body content
    const $ = cheerio.load(html);
    const bodyContent = $("body").html() || html;
    const sampleHtml =
      bodyContent.length > 40000
        ? bodyContent.substring(0, 40000)
        : bodyContent;

    const prompt = `Find the CSS selector for the container element that holds ALL apartment listings.

AGENCY: ${agencyName}

The HTML contains 73 property elements. Find the container that holds them.

Look for container elements with classes like: 'listings', 'properties', 'results', 'search-results', 'property-list', 'listing-grid', 'property-grid', 'cards', 'items', 'houses', 'apartments', 'te-huur', 'rentals', 'aanbod'

EXAMPLES: ".listings", ".properties", ".search-results", ".property-list", "[class*='listing']", "[class*='property']"

CRITICAL: Return ONLY the CSS selector, nothing else. No explanations, no quotes, just the selector.

HTML SAMPLE:
${sampleHtml}`;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.1,
    });

    const rawResponse = response.choices[0].message.content?.trim() || null;

    if (rawResponse) {
      // Extract just the selector from the response
      const selector = extractSelectorFromResponse(rawResponse) || rawResponse;

      // Validate the selector works
      const $validate = cheerio.load(html);
      const elements = $validate(selector);
      logger.info(
        `AI found selector "${selector}" for ${agencyName}, found ${elements.length} elements`
      );

      if (elements.length > 0 && selector !== "body") {
        return selector;
      } else {
        logger.warn(
          `Selector "${selector}" found no elements or is too generic for ${agencyName}`
        );
        return "body";
      }
    }

    return "body";
  } catch (error: any) {
    logger.error(`Error finding selector for ${agencyName}: ${error.message}`);
    return "body";
  }
}
