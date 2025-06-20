import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

const prisma = new PrismaClient();

export async function loadScrapedUrls(): Promise<Record<string, string[]>> {
  try {
    const scrapedUrls = await prisma.scrapedUrl.findMany({
      select: {
        url: true,
        agency: true,
      },
    });

    // Group URLs by agency (same as the file-based approach)
    const urlsByAgency: Record<string, string[]> = {};

    scrapedUrls.forEach(({ url, agency }: { url: string; agency: string }) => {
      if (!urlsByAgency[agency]) {
        urlsByAgency[agency] = [];
      }
      urlsByAgency[agency].push(url);
    });

    logger.info(
      `Loaded ${scrapedUrls.length} URLs from database for ${
        Object.keys(urlsByAgency).length
      } agencies`
    );
    return urlsByAgency;
  } catch (error: any) {
    logger.error(`Error loading scraped URLs from database: ${error.message}`);
    return {};
  }
}

export async function saveScrapedUrls(
  urlsByAgency: Record<string, string[]>
): Promise<void> {
  try {
    // Convert the agency-based structure to flat records for database
    const urlRecords: Array<{ url: string; agency: string }> = [];

    for (const [agency, urls] of Object.entries(urlsByAgency)) {
      for (const url of urls) {
        urlRecords.push({
          url,
          agency,
        });
      }
    }

    // Use upsert to handle duplicates gracefully
    await Promise.all(
      urlRecords.map(({ url, agency }) =>
        prisma.scrapedUrl.upsert({
          where: {
            url_agency: {
              url,
              agency,
            },
          },
          update: {
            scrapedAt: new Date(),
          },
          create: {
            url,
            agency,
          },
        })
      )
    );

    logger.info(
      `Saved ${urlRecords.length} URLs to database for ${
        Object.keys(urlsByAgency).length
      } agencies`
    );
  } catch (error: any) {
    logger.error(`Error saving scraped URLs to database: ${error.message}`);
  }
}

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}
