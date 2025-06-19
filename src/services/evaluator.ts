import OpenAI from "openai";
import { config } from "../config/config.js";
import logger from "../utils/logger.js";
import { Listing } from "./scraper.js";
import { flattenHTML } from "./flatten-thml.js";

// Initialize DeepSeek client (using OpenAI-compatible client)
const deepseek = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: "https://api.deepseek.com/v1",
});

const DEFAULT_CRITERIA = `MANDATORY requirements (all must be met):
- Must be in Antwerp
- If room information is provided, must have at least 2 rooms (or 1 bedroom and a bureau)
- Must cost less than 1300 EUR/month (1,300 or 1300 or 1300.00)
- Must cost more than 950 EUR/month (950 or 950.00)
- If a move-in date is provided, it must be after July 30th, if it is not provided, it is not a problem

OPTIONAL preferences (nice to have, but not required):
- Terrace would be ideal

An apartment matches if it meets ALL mandatory requirements. The terrace is optional.`;

export async function evaluateListing(
  listing: Listing,
  criteria: string = DEFAULT_CRITERIA,
  excludeUrls: string[] = [],
  focusUrls: string[] = []
): Promise<string> {
  try {
    // Use much more HTML content to ensure we don't miss listings
    const htmlContent =
      listing.html.length > 50000
        ? listing.html.substring(0, 50000)
        : listing.html;

    // Flatten the HTML for better AI analysis
    const flattenedHtml = flattenHTML(htmlContent);
    logger.info(
      `Flattened HTML for ${listing.agency}: ${flattenedHtml.length} characters with ${listing.html.length} characters in original HTML`
    );

    const excludeUrlsText =
      excludeUrls.length > 0
        ? `\n\nEXCLUDE THESE ALREADY-MATCHED URLs: ${excludeUrls.join(", ")}`
        : "";

    const focusUrlsText =
      focusUrls.length > 0
        ? `\n\nFOCUS ON THESE SPECIFIC URLs: ${focusUrls.join(", ")}`
        : "";

    const prompt = `You are analyzing a rental agency website to find ALL apartment listings. 

CRITERIA: ${criteria}

AGENCY: ${listing.agency}
URL: ${listing.url}${excludeUrlsText}${focusUrlsText}

TASK: Thoroughly analyze the flattened HTML content below and find apartment listings. Be very thorough and systematic:

1. **Search for ANY property-related content** - look for:
   - Divs with classes containing: 'property', 'listing', 'card', 'item', 'house', 'apartment', 'woning', 'huis', 'appartement'
   - Any content with prices (€, EUR, euro, prijs, price, huur, rent)
   - Any content with addresses or locations
   - Any content with room numbers (slaapkamers, bedrooms, kamers, rooms)
   - Any links (href attributes) that point to individual apartment pages

2. **Extract apartment listings** and check them against the criteria
3. **Be exhaustive** - don't stop at the first few listings
4. **Extract apartment URLs** - look for links to individual apartment pages and include them in your response
5. **Filter out already-matched URLs** - if any URLs are listed in the EXCLUDE section, do not include those apartments in your results
6. **Focus on specific URLs** - if URLs are listed in the FOCUS section, prioritize checking those specific URLs first

PRICE EVALUATION RULES:
- For price comparison: "less than 1300 EUR/month" means the price must be BELOW 1300
- Examples: €1250 = MATCHES (1250 < 1300), €1350 = DOES NOT MATCH (1350 > 1300)
- Convert all prices to numbers for comparison (ignore currency symbols and commas)
- If price is in different currency, note it but still evaluate against 1300 EUR limit

IMPORTANT: Only include apartments that match ALL mandatory criteria.

Filter out apartments that clearly don't match (wrong location, way over budget, studios when you need 2+ bedrooms, etc.).
Also filter out any apartments whose URLs are listed in the EXCLUDE section.

RESPONSE FORMAT - Keep it concise and clean:

If you find ANY apartment listings that match ALL mandatory criteria, respond with:
"YES - Found matching apartment(s): [list ONLY the matching apartments with: [URL](URL)]"

If you find apartment listings but none match ALL mandatory criteria, respond with:
"NO - No suitable apartments found"

If you can't find any apartment listings at all, respond with:
"ERROR - No apartment listings found in content"

DO NOT include:
- Verbose analysis or explanations
- Lists of filtered out apartments
- Detailed reasoning about why apartments don't match
- Repetitive information

Keep responses clean and focused only on apartments that meet ALL mandatory criteria.

FLATTENED HTML CONTENT:
${flattenedHtml}`;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8192,
      temperature: 0.1,
    });
    const answer = response.choices[0].message.content?.trim() || "ERROR";
    logger.info(`Evaluation result for ${listing.agency}: ${answer}`);
    return answer;
  } catch (error: any) {
    logger.error(`Error evaluating listing: ${error.message}`);
    return "ERROR";
  }
}
