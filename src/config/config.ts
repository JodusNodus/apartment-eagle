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
      url: "https://www.coprimmo.be/nl/te-huur?view=list&page=1&goal=1&ptype=2&pricemax=1500&cities=ANTWERPEN|2150-2600-2000-2018-2050-2060&minroom=1",
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
    {
      name: "One Vastgoed",
      url: "https://onevastgoed.be/nl/te-huur?type=1&price-min=950&price-max=1300",
      selector: ".loader",
      javascript: true,
    },
    {
      name: "Clissen Immo",
      url: "https://www.clissenimmo.be/nl/te-huur?view=list&page=1&ptype=2&cities=ANTWERPEN&pricemin=1000&pricemax=1500",
      selector: ".property-list",
    },
    {
      name: "Reant",
      url: "https://www.reant.be/nl/te-huur?view=list&page=1&pricemin=1000&pricemax=1500&ptype=2&cities=ANTWERPEN",
      selector: "ul.productdetails:nth-child(4)",
    },
    {
      name: "Demeester",
      url: "https://www.demeester.eu/nl/huren?type%5B%5D=appartement&minPrice=1000&maxPrice=1500&bedrooms=1",
      selector: "section.listing",
    },
    {
      name: "Sorenco",
      url: "https://www.sorenco.be/aanbod/te-huur/appartementen/kamers-1/max-1500-euro/",
      selector: "#properties",
    },
    {
      name: "De Waele",
      url: "https://www.dewaele.com/nl/te-huur/alle?filter%5Bcity_ids%5D%5B%5D=2834&filter%5Bstatuses%5D%5B%5D=Te+huur&filter%5Btypes%5D%5B%5D=Appartement&filter%5Bprice%5D%5Bmin%5D=&filter%5Bprice%5D%5Bmax%5D=1300&filter%5Bbedrooms%5D%5Bmin%5D=1&filter%5Bbedrooms%5D%5Bmax%5D=&filter%5Bsurface_built%5D%5Bmin%5D=&filter%5Bsurface_built%5D%5Bmax%5D=&filter%5Bsurface_plot%5D%5Bmin%5D=&filter%5Bsurface_plot%5D%5Bmax%5D=&filter%5Bsurface_livable%5D%5Bmin%5D=75&filter%5Bsurface_livable%5D%5Bmax%5D=&filter%5Bsurface_trading%5D%5Bmin%5D=&filter%5Bsurface_trading%5D%5Bmax%5D=&filter%5Bsurface_office%5D%5Bmin%5D=&filter%5Bsurface_office%5D%5Bmax%5D=&filter%5Bsurface_storage%5D%5Bmin%5D=&filter%5Bsurface_storage%5D%5Bmax%5D=&filter%5Bbathrooms%5D%5Bmin%5D=&filter%5Bbathrooms%5D%5Bmax%5D=&filter%5Bparking_spots%5D%5Bmin%5D=&filter%5Bparking_spots%5D%5Bmax%5D=&filter%5Bgarden%5D=&filter%5Bterrace%5D=&filter%5Bground_floor%5D=&filter%5Bfloor%5D%5Bmin%5D=&filter%5Bfloor%5D%5Bmax%5D=&filter%5Bsea_view%5D=&filter%5Bgarage%5D=&filter%5Bswimming_pool%5D=&filter%5Belevator%5D=&filter%5Bbike_storage%5D=&filter%5Bfurnished%5D=&filter%5Bsurface_terrace%5D%5Bmin%5D=&filter%5Bsurface_terrace%5D%5Bmax%5D=&filter%5Bloading_docks%5D%5Bmin%5D=&filter%5Bloading_docks%5D%5Bmax%5D=&filter%5Bfree_height%5D%5Bmin%5D=&filter%5Bfree_height%5D%5Bmax%5D=&filter%5Bkva%5D%5Bmin%5D=&filter%5Bkva%5D%5Bmax%5D=&filter%5Blight_street%5D=&filter%5Brolling_bridge%5D=&filter%5Brented%5D=",
      selector: "#property-list",
    },
    {
      name: "Area",
      url: "https://www.area.be/nl/te-huur/?region=&type=2&bedrooms=1&budget=900-1300",
      selector: ".property-list-page",
      javascript: true,
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
