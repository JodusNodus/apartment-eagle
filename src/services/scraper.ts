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
    logger.info(
      `Scraping ${agency.name} with Puppeteer (JavaScript rendering) at ${agency.url}`
    );

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
    logger.info(`Saved Puppeteer HTML for ${agency.name} to: ${filepath}`);

    // Log a sample of the HTML for quick debugging
    const sampleHtml = html.substring(0, 2000).replace(/\s+/g, " ");
    logger.info(`Sample HTML from ${agency.name}: ${sampleHtml}...`);

    // Also save a screenshot for visual debugging
    const screenshotPath = path.join(
      debugDir,
      `${agency.name.replace(/\s+/g, "_")}_${timestamp}.png`
    );
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    logger.info(
      `Saved Puppeteer screenshot for ${agency.name} to: ${screenshotPath}`
    );

    logger.info(
      `Received ${html.length} characters from ${agency.name} (Puppeteer)`
    );

    return {
      agency: agency.name,
      url: agency.url,
      html: html,
      timestamp: new Date(),
    };
  } catch (error: any) {
    logger.error(
      `Error scraping ${agency.name} with Puppeteer: ${error.message}`
    );
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

    logger.info(`Scraping ${agency.name} at ${agency.url}`);
    const { data } = await axios.get(agency.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Use selector from config or fall back to body
    const selector = agency.selector || "body";
    logger.info(`Using selector for ${agency.name}: ${selector}`);

    // Extract content using the selector
    const $ = cheerio.load(data);
    const bodyContent = $(selector).html();

    if (!bodyContent) {
      logger.warn(
        `Selector "${selector}" for ${agency.name} found no content, using full page`
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

    logger.info(
      `Received ${cleanContent.length} characters from ${agency.name} (cleaned)`
    );

    // Log some sample content to see what we're getting
    const sampleText = $clean
      .text()
      .substring(0, 1000)
      .replace(/\s+/g, " ")
      .trim();
    logger.info(`Sample text content: ${sampleText}...`);

    return {
      agency: agency.name,
      url: agency.url,
      html: cleanContent,
      timestamp: new Date(),
    };
  } catch (error: any) {
    logger.error(`Error scraping ${agency.name}: ${error.message}`);
    return {
      agency: agency.name,
      url: agency.url,
      html: "",
      timestamp: new Date(),
    };
  }
}

export async function scrapeAllAgencies(): Promise<Listing[]> {
  const allListings: Listing[] = [];
  for (const agency of config.agencies) {
    const listing = await scrapeAgency(agency);
    if (listing.html) {
      allListings.push(listing);
    }
  }
  return allListings;
}
