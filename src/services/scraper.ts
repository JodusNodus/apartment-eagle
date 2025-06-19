import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import { config, Agency } from "../config/config.js";
import logger from "../utils/logger.js";

export interface Listing {
  agency: string;
  url: string;
  html: string;
  timestamp: Date;
}

async function scrapeWithPuppeteer(agency: Agency): Promise<Listing> {
  let browser;
  try {
    logger.info(`[${agency.name}] Scraping with Puppeteer`);

    browser = await puppeteer.launch({
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
    });

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
      timeout: 30000,
    });

    // Wait a bit more for any delayed content
    await page.waitForTimeout(2000);

    // Get the rendered HTML
    const html = await page.content();

    // Save HTML to file for debugging
    const debugDir = path.resolve("debug");
    await fs.ensureDir(debugDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${agency.name.replace(/\s+/g, "_")}_${timestamp}.html`;
    const filepath = path.join(debugDir, filename);

    await fs.writeFile(filepath, html, "utf8");
    logger.info(`[${agency.name}] Saved HTML to: ${filepath}`);

    // Also save a screenshot for visual debugging
    const screenshotPath = path.join(
      debugDir,
      `${agency.name.replace(/\s+/g, "_")}_${timestamp}.png`
    );
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    logger.info(`[${agency.name}] Saved screenshot to: ${screenshotPath}`);

    logger.info(`[${agency.name}] Received ${html.length} characters`);

    return {
      agency: agency.name,
      url: agency.url,
      html: html,
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
  } finally {
    if (browser) {
      await browser.close();
    }
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
    logger.info(`[${agency.name}] Using selector: ${selector}`);

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

    logger.info(`[${agency.name}] Received ${cleanContent.length} characters`);

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
