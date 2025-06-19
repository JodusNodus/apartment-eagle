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
  urls: Record<string, string[]>
): Promise<void> {
  try {
    await fs.ensureDir(DATA_DIR);
    await fs.writeJson(SCRAPED_URLS_FILE, { urls }, { spaces: 2 });
    logger.info(`Saved scraped URLs for ${Object.keys(urls).length} agencies`);
  } catch (error: any) {
    logger.error(`Error saving scraped URLs: ${error.message}`);
  }
}
