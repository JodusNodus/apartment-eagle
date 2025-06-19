import dotenv from "dotenv";
dotenv.config();

export interface Agency {
  name: string;
  url: string;
  selector: string;
  titleSelector: string;
  priceSelector: string;
  linkSelector: string;
  baseUrl: string;
}

export const config = {
  openai: {
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO,
  },
  scraping: {
    intervalMinutes: parseInt(process.env.SCRAPE_INTERVAL_MINUTES || "30"),
    maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
    requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || "2000"),
  },
  server: {
    port: parseInt(process.env.PORT || "3000"),
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
  agencies: [
    {
      name: "ERA",
      url: "https://www.era.be/nl/te-huur/antwerpen",
      selector: ".property-card",
      titleSelector: ".property-title",
      priceSelector: ".property-price",
      linkSelector: "a",
      baseUrl: "https://www.era.be",
    },
    {
      name: "VB Vastgoed",
      url: "https://www.vbvastgoed.be/huren",
      selector: ".card",
      titleSelector: ".card__title",
      priceSelector: ".card__price",
      linkSelector: "a",
      baseUrl: "https://www.vbvastgoed.be",
    },
  ] as Agency[],
};

export function validateConfig(): void {
  const required = ["DEEPSEEK_API_KEY", "EMAIL_USER", "EMAIL_PASS", "EMAIL_TO"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
