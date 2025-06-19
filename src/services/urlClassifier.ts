import OpenAI from "openai";
import { config } from "../config/config.js";
import logger from "../utils/logger.js";

// Initialize DeepSeek client
const deepseek = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: "https://api.deepseek.com/v1",
});

export interface UrlClassification {
  url: string;
  isListingDetail: boolean;
  confidence: number;
}

interface UrlWithAgency {
  url: string;
  agency: string;
  agencyUrl: string;
}

export async function classifyUrlsBatch(
  urlsWithAgency: UrlWithAgency[]
): Promise<UrlClassification[]> {
  if (urlsWithAgency.length === 0) {
    return [];
  }

  try {
    logger.info(
      `Batch classifying ${urlsWithAgency.length} URLs from ${
        new Set(urlsWithAgency.map((u) => u.agency)).size
      } agencies with DeepSeek`
    );

    // Group URLs by agency for better context
    const agencyGroups = new Map<
      string,
      { agencyUrl: string; urls: string[] }
    >();
    urlsWithAgency.forEach(({ url, agency, agencyUrl }) => {
      if (!agencyGroups.has(agency)) {
        agencyGroups.set(agency, { agencyUrl, urls: [] });
      }
      agencyGroups.get(agency)!.urls.push(url);
    });

    const prompt = `You are analyzing URLs from multiple rental agency websites to identify which ones are likely to be individual apartment/property listing detail pages.

TASK: For each URL below, determine if it's likely to be a detail page for an individual property listing.

URLs that are likely to be detail pages typically:
- Contain property-specific identifiers (IDs, reference numbers)
- Have paths like /property/, /listing/, /detail/, /woning/, /appartement/
- Include property addresses or street names
- Have longer, more specific paths
- Don't end with common file extensions (.css, .js, .png, etc.)

URLs that are NOT detail pages typically:
- Are main listing/search pages
- Are contact/about/privacy pages
- Are category/filter pages
- Are static assets (CSS, JS, images)
- Are pagination links
- Are search result pages

AGENCY CONTEXTS:
${Array.from(agencyGroups.entries())
  .map(
    ([agency, { agencyUrl, urls }]) =>
      `${agency}: ${agencyUrl} (${urls.length} URLs)`
  )
  .join("\n")}

URLS TO CLASSIFY:
${urlsWithAgency
  .map((item, index) => `${index + 1}. [${item.agency}] ${item.url}`)
  .join("\n")}

RESPONSE FORMAT:
Return a JSON array with objects like:
[
  {
    "url": "https://example.com/property/123",
    "isListingDetail": true,
    "confidence": 8
  }
]

IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, no additional text.`;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      throw new Error("No response from DeepSeek");
    }

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

    const classifications: UrlClassification[] = JSON.parse(jsonContent);

    const detailPages = classifications.filter((c) => c.isListingDetail);
    logger.info(
      `Batch classified ${detailPages.length} URLs as potential detail pages out of ${urlsWithAgency.length} total`
    );

    return classifications;
  } catch (error: any) {
    logger.error(`Error batch classifying URLs: ${error.message}`);
    throw error;
  }
}
