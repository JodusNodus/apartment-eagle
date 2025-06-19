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
import { extractUrlsFromHtml } from "./utils/urlExtractor.js";

import { Listing } from "./services/scraper.js";

// Function to get random interval between min and max
function getRandomInterval(): number {
  const min = config.scraping.intervalMinutes;
  const max = config.scraping.maxIntervalMinutes;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to schedule next run with random interval
function scheduleNextRun(): void {
  const interval = getRandomInterval();
  logger.info(`Scheduling next scrape in ${interval} minutes`);

  setTimeout(async () => {
    await main();
    scheduleNextRun(); // Schedule the next run
  }, interval * 60 * 1000);
}

async function main(): Promise<void> {
  try {
    validateConfig();
    logger.info("Starting apartment watcher...");

    // Load previously scraped URLs
    const previousScrapedUrls = await loadScrapedUrls();
    logger.info(
      `Loaded ${Object.keys(previousScrapedUrls).length} previous URL sets`
    );

    // Scrape all agencies in parallel
    const current: Listing[] = await scrapeAllAgencies();
    logger.info(`Scraped ${current.length} agencies`);

    // Process all agencies in parallel
    const agencyPromises = current.map(async (listing) => {
      try {
        const currentUrls = extractUrlsFromHtml(listing.html, listing.url);
        logger.info(`[${listing.agency}] Extracted ${currentUrls.length} URLs`);

        const previousUrls = previousScrapedUrls[listing.agency] || [];

        // Check if URLs have changed
        const hasNewUrls = currentUrls.some(
          (url) => !previousUrls.includes(url)
        );
        const hasRemovedUrls = previousUrls.some(
          (url) => !currentUrls.includes(url)
        );

        if (hasNewUrls || hasRemovedUrls) {
          logger.info(
            `[${listing.agency}] URLs changed: ${currentUrls.length} current vs ${previousUrls.length} previous`
          );

          if (hasNewUrls) {
            // Find new URLs that haven't been seen before
            const newUrls = currentUrls.filter(
              (url) => !previousUrls.includes(url)
            );

            if (newUrls.length > 0) {
              logger.info(
                `[${listing.agency}] Found ${newUrls.length} new URLs, evaluating...`
              );

              // Ask AI to only check for these specific URLs
              const evaluation = await evaluateListing(
                listing,
                undefined,
                [],
                newUrls
              );

              if (evaluation.includes("YES") || evaluation.includes("CLOSE")) {
                logger.info(`[${listing.agency}] Found matching apartments`);
                return {
                  agency: listing.agency,
                  evaluation: evaluation,
                  url: listing.url,
                  currentUrls: currentUrls,
                };
              } else {
                logger.info(`[${listing.agency}] No matching apartments found`);
              }
            }
          }
        } else {
          logger.info(`[${listing.agency}] No URL changes detected`);
        }

        // Return current URLs for saving (even if no evaluation needed)
        return {
          agency: listing.agency,
          currentUrls: currentUrls,
        };
      } catch (error: any) {
        logger.error(`[${listing.agency}] Error: ${error.message}`);
        return {
          agency: listing.agency,
          currentUrls: [],
        };
      }
    });

    // Wait for all agencies to be processed in parallel
    const results = await Promise.all(agencyPromises);

    // Separate evaluations from URL data
    const evaluations: Array<{
      agency: string;
      evaluation: string;
      url: string;
    }> = [];

    const currentScrapedUrls: Record<string, string[]> = {};

    // Process results
    results.forEach((result) => {
      if ("evaluation" in result && "url" in result) {
        // This agency has an evaluation
        evaluations.push({
          agency: result.agency,
          evaluation: result.evaluation as string,
          url: result.url as string,
        });
      }

      // Always save current URLs
      currentScrapedUrls[result.agency] = result.currentUrls;
    });

    // Send batch notification if there are any evaluations
    if (evaluations.length > 0) {
      await sendBatchNotification(evaluations);
      logger.info(`Sent notification for ${evaluations.length} agencies`);
    } else {
      logger.info("No new apartments found");
    }

    await saveScrapedUrls(currentScrapedUrls);
    await saveListings(current);
    logger.info("Cycle completed");
  } catch (error: any) {
    logger.error(`Fatal error: ${error.message}`);
  }
}

// Start the first run immediately
main();

// Schedule subsequent runs with random intervals
scheduleNextRun();
