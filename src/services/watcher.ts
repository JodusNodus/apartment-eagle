import fs from "fs-extra";
import path from "path";
import logger from "../utils/logger.js";

const DATA_DIR = "data";
const SCRAPED_URLS_FILE = path.join(DATA_DIR, "scraped_urls.json");

export async function loadScrapedUrls(): Promise<Record<string, string[]>> {
  try {
    if (await fs.pathExists(SCRAPED_URLS_FILE)) {
      const data = await fs.readJson(SCRAPED_URLS_FILE);
      return data.urls || {};
    }
  } catch (error: any) {
    logger.error(`Error loading scraped URLs: ${error.message}`);
  }
  return {};
}

export async function saveScrapedUrls(
  newUrls: Record<string, string[]>
): Promise<void> {
  try {
    await fs.ensureDir(DATA_DIR);

    // Load existing URLs
    const existingUrls = await loadScrapedUrls();

    // Merge new URLs with existing ones, ensuring uniqueness
    const mergedUrls: Record<string, string[]> = {};

    for (const [agency, newAgencyUrls] of Object.entries(newUrls)) {
      const existingAgencyUrls = existingUrls[agency] || [];

      // Combine existing and new URLs, then remove duplicates
      const allAgencyUrls = [...existingAgencyUrls, ...newAgencyUrls];
      const uniqueAgencyUrls = [...new Set(allAgencyUrls)];

      mergedUrls[agency] = uniqueAgencyUrls;

      // Log if we found new URLs for this agency
      const newUniqueUrls = newAgencyUrls.filter(
        (url) => !existingAgencyUrls.includes(url)
      );
      if (newUniqueUrls.length > 0) {
        logger.info(
          `[${agency}] Added ${newUniqueUrls.length} new unique URLs (total: ${uniqueAgencyUrls.length})`
        );
      }
    }

    await fs.writeJson(SCRAPED_URLS_FILE, { urls: mergedUrls }, { spaces: 2 });
    logger.info(
      `Saved scraped URLs for ${Object.keys(mergedUrls).length} agencies`
    );
  } catch (error: any) {
    logger.error(`Error saving scraped URLs: ${error.message}`);
  }
}
