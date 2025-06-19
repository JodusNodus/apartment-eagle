# New Detail-Based Approach with Batched URL Classification

This document explains the new approach for the apartment watcher that focuses on individual property detail pages with efficient batched URL classification.

## Overview

The new approach follows this optimized workflow:

1. **Scrape All Agencies**: Get all URLs from the main agency pages (existing functionality)
2. **Extract URLs**: Extract all URLs from all agencies and identify new ones
3. **Batch Classify URLs**: Use DeepSeek AI to classify ALL new URLs from ALL agencies in a single batch
4. **Group by Agency**: Group the classified URLs back by agency
5. **Scrape Detail Pages**: Use Puppeteer to render and scrape individual property detail pages
6. **Evaluate Properties**: Use DeepSeek AI to evaluate each individual property against the criteria

## Benefits

- **More Accurate**: Evaluates actual property details instead of trying to parse listings from overview pages
- **Better Data Extraction**: Gets specific property information (price, address, rooms, features, etc.)
- **Reduced False Positives**: Only evaluates URLs that are confirmed to be detail pages
- **Better Debugging**: Saves individual property pages and screenshots for debugging
- **Efficient API Usage**: Batches URL classification to reduce API calls and costs
- **Faster Processing**: Single classification call instead of multiple per-agency calls

## New Services

### 1. URL Classifier (`src/services/urlClassifier.ts`)

Uses DeepSeek AI to classify URLs as potential property detail pages. Now includes:

- **`classifyUrlsBatch()`**: New function that classifies URLs from multiple agencies in a single API call
- **`classifyUrls()`**: Original per-agency function (kept for backward compatibility)
- **Better Context**: Provides agency context in batch classification for more accurate results

### 2. Detail Scraper (`src/services/detailScraper.ts`)

Uses Puppeteer to scrape individual property detail pages and extract:

- Property title
- Price
- Address
- Number of rooms
- Surface area
- Description
- Features/amenities
- Images
- Available from date

### 3. Detail Evaluator (`src/services/detailEvaluator.ts`)

Uses DeepSeek AI to evaluate individual properties against the criteria:

- Location (must be in Antwerp)
- Price range (950-1300 EUR)
- Room requirements (2+ rooms or 1 bedroom + bureau)
- Move-in date (after July 30th if specified)

## Workflow Changes

### Before (Per-Agency Classification):

```
Scrape Agency A → Extract URLs → Classify URLs → Scrape Details → Evaluate
Scrape Agency B → Extract URLs → Classify URLs → Scrape Details → Evaluate
Scrape Agency C → Extract URLs → Classify URLs → Scrape Details → Evaluate
```

### After (Batched Classification):

```
Scrape All Agencies → Extract All URLs → Batch Classify All URLs → Group by Agency → Scrape Details → Evaluate
```

## Performance Improvements

- **Reduced API Calls**: Instead of N classification calls (one per agency), now uses 1 batch call
- **Better Context**: AI can see patterns across multiple agencies for better classification
- **Faster Processing**: No waiting for multiple sequential API calls
- **Cost Effective**: Fewer API tokens used for classification

## Configuration

The approach uses the same configuration as before, but now focuses on:

- `javascript: true` agencies will use Puppeteer for both main page and detail pages
- All detail pages are scraped with Puppeteer for consistent rendering
- Debug files are saved in `debug/detail-pages/` for each scraped property

## Testing

Run the test script to verify the new batched approach:

```bash
npx tsx test-batched-classification.ts
```

This will test the batch classification with sample URLs from multiple agencies.

## Migration

The new approach is backward compatible:

- Still saves URLs for change detection
- Still uses the same notification system
- Still respects the same configuration and environment variables
- Original `classifyUrls()` function is still available if needed

## Performance Considerations

- URL classification is done in a single batch to minimize API calls
- Detail page scraping includes delays between requests
- Property evaluation includes rate limiting
- Debug files are saved for troubleshooting

## Debug Output

The new approach creates detailed debug output:

- `debug/detail-pages/` - HTML and screenshots of each scraped property
- Detailed logging of each step in the process
- Confidence scores for URL classification
- Individual property evaluation results
- Batch classification statistics
