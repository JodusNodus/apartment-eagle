import dotenv from "dotenv";
dotenv.config();

export interface Agency {
  name: string;
  url: string;
  selector?: string;
  javascript?: boolean;
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
    maxIntervalMinutes: parseInt(
      process.env.MAX_SCRAPE_INTERVAL_MINUTES || "45"
    ),
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
      selector: ".view__content",
    },
    {
      name: "VB Vastgoed",
      url: "https://www.vbvastgoed.be/huren",
      selector: ".view-content",
    },
    {
      name: "Quares",
      url: "https://immo.quares.be/en/for-rent?type%5B%5D=33fe778c-fa4e-4911-83c5-9fe735c5917d&minPrice=0&maxPrice=1300&bedrooms=&reference=&term=",
      selector: "#estate-list",
    },
    {
      name: "Vastgoed4You",
      url: "https://www.vastgoed4you.be/nl/te-huur/?bedrooms=1&price=0-1300",
      selector: ".grid-wrapper",
      javascript: true,
    },
    {
      name: "Walls",
      url: "https://www.walls.be/tehuur?term=&type%5B%5D=Appartement&minPrice=1000&maxPrice=1300&minArea=75&maxArea=&bedrooms=1&hasTerrace=1",
      selector: "#estates-grid",
      javascript: true,
    },
    {
      name: "Coprimmo",
      url: "https://www.coprimmo.be/nl/te-huur?view=list&task=showAjaxList&page=1&goal=1&ptype=2&pricemax=1500&cities=ANTWERPEN|2150-2600-2000-2018-2050-2060&minroom=1",
      selector: ".propety-group",
      javascript: true,
    },
    {
      name: "De Boer en Partners",
      url: "https://deboerenpartners.be/huur/appartement/2000-antwerpen+2018+2040-antwerpen+2050+2060+2100-antwerpen+2140-antwerpen+2170-antwerpen+2180-antwerpen+2600-antwerpen+2610-antwerpen+2660-antwerpen+2600-berchem+2140-borgerhout+2100-deurne+2180-ekeren+2610-wilrijk?priceRange%5B%5D=1000-1500&view=gallery",
      selector: "#estates-grid",
    },
    {
      name: "Engel & Völkers",
      url: "https://www.engelvoelkers.com/be/nl/eigendom/res/huur/vastgoed?businessArea[]=residential&currency=EUR&measurementSystem=metric&page=1&placeId=ChIJfYjDv472w0cRuIqogoRErz4&propertyMarketingType[]=rent&rooms.min=2&searchRadius=5&sortingOptions[]=PUBLISHED_AT_DESC&placeName=Antwerpen%2C+Belgi%C3%AB",
      selector: ".sc-hNeXXF",
    },
    {
      name: "Heylen Vastgoed",
      url: "https://www.heylenvastgoed.be/nl/huren?city%5B%5D=D-2000&search_terms=&price_from=1000&price_till=1500&type=2&bedrooms=1&surface_from=&surface_till=&living_from=75&living_till=&order=newest#results",
      selector: ".c-results",
    },
    {
      name: "Hintjens",
      url: "https://www.hintjens.eu/nl/te-huur/appartementen/1-kamers/min-1000-euro/max-1300-euro",
      selector: ".grid",
    },
    {
      name: "At home & Partners",
      url: "https://www.athomepartners.be/huren?type=appartement&minimum-prijs=1000&maximum-prijs=1500",
      selector: "div.px-8:nth-child(3)",
      javascript: true,
    },
    {
      name: "Huyzen",
      selector: ".property-tiles-grid",
      url: "https://www.huyzen.be/te-huur/antwerpen-2000-regio/alle?category[]=flat&price[]=950&price[]=1300&view=list",
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
