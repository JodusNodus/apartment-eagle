import "dotenv/config";
import { config, validateConfig } from "./config/config.js";
import logger from "./utils/logger.js";
import { scrapeAllAgencies, closeSharedBrowser } from "./services/scraper.js";
import {
  saveListings,
  loadScrapedUrls,
  saveScrapedUrls,
} from "./services/watcher.js";
import { extractUrlsFromHtml } from "./utils/urlExtractor.js";
import {
  classifyUrlsBatch,
  UrlClassification,
} from "./services/urlClassifier.js";
import { scrapeDetailPages } from "./services/detailScraper.js";
import { evaluateAllProperties } from "./services/detailEvaluator.js";
import { sendBatchNotification } from "./services/notifier.js";

import { Listing } from "./services/scraper.js";
import { PropertyDetail } from "./services/detailScraper.js";
import { PropertyEvaluation } from "./services/detailEvaluator.js";

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

// Graceful shutdown handler
function setupGracefulShutdown(): void {
  const shutdown = async () => {
    logger.info("Shutting down gracefully...");
    await closeSharedBrowser();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main(): Promise<void> {
  logger.info("Starting cycle");
  try {
    validateConfig();
    logger.info(
      "Starting apartment watcher with batched URL classification..."
    );

    // Load previously scraped URLs
    const previousScrapedUrls = await loadScrapedUrls();
    logger.info(
      `Loaded ${Object.keys(previousScrapedUrls).length} previous URL sets`
    );

    // Step 1: Scrape all agencies in parallel
    const current: Listing[] = await scrapeAllAgencies();
    logger.info(`Scraped ${current.length} agencies`);

    // Step 2: Extract all URLs from all agencies
    const allAgencyData: Array<{
      agency: string;
      agencyUrl: string;
      currentUrls: string[];
      previousUrls: string[];
      newUrls: string[];
    }> = [];

    for (const listing of current) {
      const currentUrls = extractUrlsFromHtml(listing.html, listing.url);
      const previousUrls = previousScrapedUrls[listing.agency] || [];

      // Find new URLs that haven't been seen before
      const newUrls = currentUrls.filter((url) => !previousUrls.includes(url));

      allAgencyData.push({
        agency: listing.agency,
        agencyUrl: listing.url,
        currentUrls,
        previousUrls,
        newUrls,
      });

      logger.info(
        `[${listing.agency}] Extracted ${currentUrls.length} URLs, ${newUrls.length} new`
      );
    }

    // Step 3: Collect all new URLs from all agencies
    const allNewUrls: Array<{
      url: string;
      agency: string;
      agencyUrl: string;
    }> = [];

    allAgencyData.forEach(({ agency, agencyUrl, newUrls }) => {
      newUrls.forEach((url) => {
        allNewUrls.push({ url, agency, agencyUrl });
      });
    });

    if (allNewUrls.length === 0) {
      logger.info("No new URLs found across all agencies");

      // Save current URLs and exit
      const currentScrapedUrls: Record<string, string[]> = {};
      allAgencyData.forEach(({ agency, currentUrls }) => {
        currentScrapedUrls[agency] = currentUrls;
      });
      await saveScrapedUrls(currentScrapedUrls);
      await saveListings(current);
      logger.info("Cycle completed - no new URLs");
      return;
    }

    logger.info(
      `Found ${allNewUrls.length} new URLs across all agencies, starting batch classification`
    );

    // Step 4: Handle URL classification or skip if only 1 URL
    let allClassifications: UrlClassification[];

    if (allNewUrls.length === 1) {
      logger.info(
        "Only 1 new URL found, skipping classification and assuming it's a detail page"
      );
      // Create a mock classification assuming it's a detail page
      allClassifications = [
        {
          url: allNewUrls[0].url,
          isListingDetail: true,
          confidence: 8,
        },
      ];
    } else {
      // Step 4: Batch classify all new URLs together
      allClassifications = await classifyUrlsBatch(allNewUrls);
      logger.info(`Batch classified ${allClassifications.length} URLs`);
    }

    // Step 5: Group classifications by agency and process detail pages
    const agencyClassifications = new Map<string, UrlClassification[]>();

    allClassifications.forEach((classification) => {
      const agency = allNewUrls.find(
        (u) => u.url === classification.url
      )?.agency;
      if (agency) {
        if (!agencyClassifications.has(agency)) {
          agencyClassifications.set(agency, []);
        }
        agencyClassifications.get(agency)!.push(classification);
      }
    });

    // Step 6: Process detail pages for each agency
    const allMatchingProperties: PropertyEvaluation[] = [];

    for (const [agencyName, classifications] of agencyClassifications) {
      try {
        // Find the agency configuration
        const agency = config.agencies.find((a) => a.name === agencyName);
        if (!agency) {
          logger.error(`[${agencyName}] Agency configuration not found`);
          continue;
        }

        const detailPages = await scrapeDetailPages(agency, classifications);

        if (detailPages.length > 0) {
          const evaluations = await evaluateAllProperties(detailPages);
          const matchingProperties = evaluations.filter((e) => e.matches);

          if (matchingProperties.length > 0) {
            logger.info(
              `[${agencyName}] Found ${matchingProperties.length} matching properties`
            );
            allMatchingProperties.push(...matchingProperties);
          } else {
            logger.info(`[${agencyName}] No matching properties found`);
          }
        } else {
          logger.info(`[${agencyName}] No detail pages to evaluate`);
        }
      } catch (error: any) {
        logger.error(
          `[${agencyName}] Error processing detail pages: ${error.message}`
        );
      }
    }

    // Step 7: Send notifications if there are matching properties
    if (allMatchingProperties.length > 0) {
      const evaluations = allMatchingProperties.map((evaluation) => ({
        agency: evaluation.property.agency,
        evaluation: `MATCH: ${evaluation.property.url} - ${evaluation.reasoning}`,
        url: evaluation.property.url,
      }));

      await sendBatchNotification(evaluations);
    }

    // Step 8: Save current URLs and listings
    const currentScrapedUrls: Record<string, string[]> = {};
    allAgencyData.forEach(({ agency, currentUrls }) => {
      currentScrapedUrls[agency] = currentUrls;
    });

    await saveScrapedUrls(currentScrapedUrls);
    await saveListings(current);
    logger.info("Cycle completed");
  } catch (error: any) {
    logger.error(`Fatal error: ${error.message}`);
  }
}

// Setup graceful shutdown
setupGracefulShutdown();

// Start the first run immediately
main();

// Schedule subsequent runs with random intervals
scheduleNextRun();
