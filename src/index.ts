import "dotenv/config";
import { config, validateConfig } from "./config/config.js";
import logger from "./utils/logger.js";
import { scrapeAllAgencies } from "./services/scraper.js";
import {
  saveListings,
  loadScrapedUrls,
  saveScrapedUrls,
} from "./services/watcher.js";
import { evaluateListing } from "./services/evaluator.js";
import { sendBatchNotification } from "./services/notifier.js";
import { extractUrlsFromHtml, debugAllHrefs } from "./utils/urlExtractor.js";
import cron from "node-cron";

import { Listing } from "./services/scraper.js";

async function main(): Promise<void> {
  try {
    validateConfig();
    logger.info("Starting apartment watcher...");

    // Load previously scraped URLs
    const previousScrapedUrls = await loadScrapedUrls();
    logger.info(
      `Loaded previous scraped URLs for ${
        Object.keys(previousScrapedUrls).length
      } agencies`
    );

    // Scrape all agencies
    const current: Listing[] = await scrapeAllAgencies();
    logger.info(`Scraped ${current.length} agencies`);

    const currentScrapedUrls: Record<string, string[]> = {};
    const evaluations: Array<{
      agency: string;
      evaluation: string;
      url: string;
    }> = [];

    // Extract URLs from scraped content and compare with previous
    for (const listing of current) {
      // Debug: show all href attributes
      const allHrefs = debugAllHrefs(listing.html);
      logger.info(
        `Found ${allHrefs.length} total href attributes in ${
          listing.agency
        }: ${allHrefs.slice(0, 5).join(", ")}${
          allHrefs.length > 5 ? "..." : ""
        }`
      );

      const currentUrls = extractUrlsFromHtml(listing.html, listing.url);
      currentScrapedUrls[listing.agency] = currentUrls;

      logger.info(
        `Extracted ${currentUrls.length} URLs from ${listing.agency}`
      );

      const previousUrls = previousScrapedUrls[listing.agency] || [];

      // Check if URLs have changed
      const hasNewUrls = currentUrls.some((url) => !previousUrls.includes(url));
      const hasRemovedUrls = previousUrls.some(
        (url) => !currentUrls.includes(url)
      );

      if (hasNewUrls || hasRemovedUrls) {
        logger.info(
          `URLs changed for ${listing.agency}: ${currentUrls.length} current vs ${previousUrls.length} previous`
        );

        if (hasNewUrls) {
          // Find new URLs that haven't been seen before
          const newUrls = currentUrls.filter(
            (url) => !previousUrls.includes(url)
          );

          if (newUrls.length > 0) {
            logger.info(
              `Found ${newUrls.length} new URLs for ${listing.agency}, evaluating...`
            );

            // Ask AI to only check for these specific URLs
            const evaluation = await evaluateListing(
              listing,
              undefined,
              [],
              newUrls
            );
            if (evaluation.includes("YES") || evaluation.includes("CLOSE")) {
              evaluations.push({
                agency: listing.agency,
                evaluation: evaluation,
                url: listing.url,
              });
            }
          } else {
            logger.info(`No new URLs to evaluate for ${listing.agency}`);
          }
        }
      } else {
        logger.info(`No URL changes detected for ${listing.agency}`);
      }
    }

    // Send batch notification if there are any evaluations
    if (evaluations.length > 0) {
      await sendBatchNotification(evaluations);
      logger.info(
        `Sent batch notification with ${evaluations.length} evaluations`
      );
    } else {
      logger.info("No new apartments found, no notification sent");
    }

    await saveScrapedUrls(currentScrapedUrls);
    await saveListings(current);
  } catch (error: any) {
    logger.error(`Fatal error: ${error.message}`);
  }
}

// Schedule the watcher
cron.schedule(`*/${config.scraping.intervalMinutes} * * * *`, main);

// Run immediately on startup
main();
