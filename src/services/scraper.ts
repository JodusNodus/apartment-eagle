import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs-extra";
import path from "path";
import { config, Agency } from "../config/config.js";
import logger from "../utils/logger.js";
import { findSelectorsWithAI } from "./selector-finder.js";

export interface Listing {
  agency: string;
  url: string;
  html: string;
  timestamp: Date;
}

const SELECTORS_FILE = path.resolve("data/selectors.json");

async function loadSelectors(): Promise<Record<string, string>> {
  try {
    return await fs.readJson(SELECTORS_FILE);
  } catch {
    return {};
  }
}

async function saveSelectors(selectors: Record<string, string>): Promise<void> {
  await fs.ensureFile(SELECTORS_FILE);
  await fs.writeJson(SELECTORS_FILE, selectors, { spaces: 2 });
}

export async function scrapeAgency(agency: Agency): Promise<Listing> {
  try {
    logger.info(`Scraping ${agency.name} at ${agency.url}`);
    const { data } = await axios.get(agency.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Load existing selectors
    const selectors = await loadSelectors();
    let selector = selectors[agency.name];

    // If no selector exists, use AI to find one
    if (!selector) {
      logger.info(
        `No selector found for ${agency.name}, using AI to find one...`
      );
      const aiSelector = await findSelectorsWithAI(data, agency.name);
      if (aiSelector && aiSelector !== "body") {
        selector = aiSelector;
        selectors[agency.name] = selector;
        await saveSelectors(selectors);
        logger.info(`Saved selector for ${agency.name}: ${selector}`);
      } else {
        throw new Error(
          `Could not find a specific selector for ${agency.name}. AI returned: ${aiSelector}`
        );
      }
    }

    // Fail if selector is "body" (too generic)
    if (selector === "body") {
      throw new Error(
        `Selector for ${agency.name} is too generic ("body"). Need a more specific selector.`
      );
    }

    // Extract content using the selector
    const $ = cheerio.load(data);
    const bodyContent = $(selector).html();

    if (!bodyContent) {
      throw new Error(
        `Selector "${selector}" for ${agency.name} found no content.`
      );
    }

    logger.info(`Using AI selector for ${agency.name}: ${selector}`);

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
