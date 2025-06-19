/**
 * Extracts URLs from HTML content
 * Uses a more comprehensive approach to find property-related URLs
 */
export function extractUrlsFromHtml(html: string, agencyUrl: string): string[] {
  const urls: string[] = [];

  // Extract all href attributes from the HTML
  const hrefPattern = /href=["']([^"']+)["']/gi;
  const matches = html.matchAll(hrefPattern);

  for (const match of matches) {
    if (match[1]) {
      let url = match[1];

      // Convert relative URLs to absolute URLs
      if (url.startsWith("/")) {
        const baseUrl = new URL(agencyUrl);
        url = `${baseUrl.protocol}//${baseUrl.host}${url}`;
      } else if (!url.startsWith("http")) {
        const baseUrl = new URL(agencyUrl);
        url = `${baseUrl.protocol}//${baseUrl.host}/${url}`;
      }

      urls.push(url);
    }
  }

  // Filter URLs to only include potential property listings
  const propertyUrls = urls.filter((url) => {
    // Exclude common non-property URLs
    const excludePatterns = [
      /\/contact/i,
      /\/about/i,
      /\/privacy/i,
      /\/terms/i,
      /\/cookies/i,
      /\/login/i,
      /\/register/i,
      /\/search/i,
      /\/filter/i,
      /\/sort/i,
      /\.css$/i,
      /\.js$/i,
      /\.png$/i,
      /\.jpg$/i,
      /\.jpeg$/i,
      /\.gif$/i,
      /\.svg$/i,
      /\.ico$/i,
      /\.pdf$/i,
      /mailto:/i,
      /tel:/i,
      /#/i,
    ];

    if (excludePatterns.some((pattern) => pattern.test(url))) {
      return false;
    }

    return true;
  });

  return [...new Set(propertyUrls)]; // Remove duplicates
}

/**
 * Checks if HTML content contains any new URLs that haven't been seen before
 */
export function hasNewUrls(
  html: string,
  agencyUrl: string,
  excludeUrls: string[]
): boolean {
  const urls = extractUrlsFromHtml(html, agencyUrl);

  // Check if any of the extracted URLs are not in the exclude list
  return urls.some((url) => !excludeUrls.includes(url));
}
