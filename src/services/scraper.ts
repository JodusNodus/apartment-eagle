import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer, { Browser } from "puppeteer";
import { config, Agency } from "../config/config.js";
import logger from "../utils/logger.js";

export interface Listing {
  agency: string;
  url: string;
  html: string;
  timestamp: Date;
}

// Shared browser instance
let sharedBrowser: Browser | null = null;

export async function getSharedBrowser(): Promise<Browser> {
  if (!sharedBrowser) {
    logger.info("Creating shared Puppeteer browser instance");
    sharedBrowser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
      ignoreDefaultArgs: ["--disable-extensions"],
    });
  }
  return sharedBrowser;
}

export async function closeSharedBrowser(): Promise<void> {
  if (sharedBrowser) {
    logger.info("Closing shared Puppeteer browser instance");
    await sharedBrowser.close();
    sharedBrowser = null;
  }
}

async function scrapeWithPuppeteer(agency: Agency): Promise<Listing> {
  try {
    logger.info(`[${agency.name}] Scraping with Puppeteer`);

    const browser = await getSharedBrowser();
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the page
    await page.goto(agency.url, {
      waitUntil: "networkidle2",
      timeout: 50000,
    });

    // Get the rendered HTML
    const html = await page.content();

    // Use selector from config or fall back to body
    const selector = agency.selector || "body";

    // Extract content using the selector
    const $ = cheerio.load(html);
    const bodyContent = $(selector).html();

    return {
      agency: agency.name,
      url: agency.url,
      html: bodyContent || html,
      timestamp: new Date(),
    };
  } catch (error: any) {
    logger.error(`[${agency.name}] Puppeteer error: ${error.message}`);
    return {
      agency: agency.name,
      url: agency.url,
      html: "",
      timestamp: new Date(),
    };
  }
}

export async function scrapeAgency(agency: Agency): Promise<Listing> {
  try {
    // Check if agency needs JavaScript rendering
    if (agency.javascript) {
      return await scrapeWithPuppeteer(agency);
    }

    logger.info(`[${agency.name}] Scraping`);
    const { data } = await axios.get(agency.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Use selector from config or fall back to body
    const selector = agency.selector || "body";

    // Extract content using the selector
    const $ = cheerio.load(data);
    const bodyContent = $(selector).html();

    if (!bodyContent) {
      logger.warn(
        `[${agency.name}] Selector found no content, using full page`
      );
      return {
        agency: agency.name,
        url: agency.url,
        html: data,
        timestamp: new Date(),
      };
    }

    // Remove common navigation and header elements
    const $clean = cheerio.load(bodyContent);
    $clean(
      "nav, header, footer, .nav, .header, .footer, .sidebar, .menu, .breadcrumb"
    ).remove();
    $clean("script, style, noscript, .advertisement, .ads").remove();

    const cleanContent = $clean.html() || bodyContent;

    return {
      agency: agency.name,
      url: agency.url,
      html: cleanContent,
      timestamp: new Date(),
    };
  } catch (error: any) {
    logger.error(`[${agency.name}] Scraping error: ${error.message}`);
    return {
      agency: agency.name,
      url: agency.url,
      html: "",
      timestamp: new Date(),
    };
  }
}

export async function scrapeAllAgencies(): Promise<Listing[]> {
  const scrapingPromises = config.agencies.map(async (agency) => {
    try {
      const listing = await scrapeAgency(agency);
      if (listing.html) {
        return listing;
      }
      return null;
    } catch (error: any) {
      logger.error(`Failed to scrape ${agency.name}: ${error.message}`);
      return null;
    }
  });

  const results = await Promise.all(scrapingPromises);
  return results.filter((listing): listing is Listing => listing !== null);
}
