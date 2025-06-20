-- CreateTable
CREATE TABLE "scraped_urls" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraped_urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scraped_urls_url_agency_key" ON "scraped_urls"("url", "agency");
