import logger from "../utils/logger.js";
import { UrlClassification } from "./urlClassifier.js";
import { getSharedBrowser } from "./scraper.js";
import axios from "axios";
import * as cheerio from "cheerio";
import { Agency } from "../config/config.js";

export interface PropertyDetail {
  url: string;
  agency: string;
  html: string;
  timestamp: Date;
}

async function scrapeDetailPageWithHttp(
  url: string,
  agencyName: string
): Promise<PropertyDetail> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const cleanHtml = $.html();

    return {
      url,
      agency: agencyName,
      html: cleanHtml,
      timestamp: new Date(),
    };
  } catch (error: any) {
    logger.error(
      `[${agencyName}] Error scraping detail page with HTTP ${url}: ${error.message}`
    );
    return {
      url,
      agency: agencyName,
      html: "",
      timestamp: new Date(),
    };
  }
}

async function scrapeDetailPageWithPuppeteer(
  url: string,
  agencyName: string
): Promise<PropertyDetail> {
  try {
    const browser = await getSharedBrowser();
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the page
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 50000,
    });

    // Get the rendered HTML
    const html = await page.content();

    return {
      url,
      agency: agencyName,
      html,
      timestamp: new Date(),
    };
  } catch (error: any) {
    logger.error(
      `[${agencyName}] Error scraping detail page with Puppeteer ${url}: ${error.message}`
    );
    return {
      url,
      agency: agencyName,
      html: "",
      timestamp: new Date(),
    };
  }
}

export async function scrapeDetailPages(
  agency: Agency,
  classifications: UrlClassification[]
): Promise<PropertyDetail[]> {
  const detailPages = classifications.filter(
    (c) => c.isListingDetail && c.confidence >= 5
  );

  if (detailPages.length === 0) {
    logger.info(`[${agency.name}] No high-confidence detail pages found`);
    return [];
  }

  logger.info(`[${agency.name}] Scraping ${detailPages.length} detail pages`);

  // Choose the appropriate scraping method based on agency configuration
  const scrapeMethod = agency.javascript
    ? scrapeDetailPageWithPuppeteer
    : scrapeDetailPageWithHttp;

  // Scrape detail pages in parallel with a small delay to avoid overwhelming servers
  const details: PropertyDetail[] = [];

  for (let i = 0; i < detailPages.length; i++) {
    const classification = detailPages[i];
    try {
      const detail = await scrapeMethod(classification.url, agency.name);
      if (detail.html) {
        details.push(detail);
      }

      // Add a small delay between requests
      if (i < detailPages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (error: any) {
      logger.error(
        `[${agency.name}] Failed to scrape ${classification.url}: ${error.message}`
      );
    }
  }

  logger.info(
    `[${agency.name}] Successfully scraped ${details.length} detail pages out of ${detailPages.length} attempts`
  );
  return details;
}
