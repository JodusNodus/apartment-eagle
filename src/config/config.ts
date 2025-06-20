import dotenv from "dotenv";
dotenv.config();

export interface Agency {
  name: string;
  url: string;
  selector?: string;
  javascript?: boolean;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string[];
}

const MIN_PRICE = 900;
const MAX_PRICE = 1300;

export const config = {
  openai: {
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO?.split(",").map((email) => email.trim()) || [],
  } as EmailConfig,
  scraping: {
    intervalMinutes: parseInt(process.env.SCRAPE_INTERVAL_MINUTES || "30"),
    maxIntervalMinutes: parseInt(
      process.env.MAX_SCRAPE_INTERVAL_MINUTES || "45"
    ),
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
      url: `https://immo.quares.be/en/for-rent?type%5B%5D=33fe778c-fa4e-4911-83c5-9fe735c5917d&minPrice=0&maxPrice=${MAX_PRICE}&reference=&term=`,
      selector: "#estate-list",
    },
    {
      name: "Vastgoed4You",
      url: `https://www.vastgoed4you.be/nl/te-huur/?price=0-${MAX_PRICE}`,
      selector: ".grid-wrapper",
      javascript: true,
    },
    {
      name: "Walls",
      url: `https://www.walls.be/tehuur?term=&type%5B%5D=Appartement&minPrice=${MIN_PRICE}&maxPrice=${MAX_PRICE}&minArea=75`,
      selector: "#estates-grid",
      javascript: true,
    },
    {
      name: "Coprimmo",
      url: `https://www.coprimmo.be/nl/te-huur?view=list&page=1&goal=1&ptype=2&pricemax=${MAX_PRICE}&cities=ANTWERPEN|2150-2600-2000-2018-2050-2060`,
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
      url: "https://www.engelvoelkers.com/be/nl/eigendom/res/huur/vastgoed?businessArea[]=residential&currency=EUR&measurementSystem=metric&page=1&placeId=ChIJfYjDv472w0cRuIqogoRErz4&propertyMarketingType[]=rent&searchRadius=5&sortingOptions[]=PUBLISHED_AT_DESC&placeName=Antwerpen%2C+Belgi%C3%AB",
      selector: ".sc-hNeXXF",
    },
    {
      name: "Heylen Vastgoed",
      url: `https://www.heylenvastgoed.be/nl/huren?city%5B%5D=D-2000&search_terms=&price_from=${MIN_PRICE}&price_till=${MAX_PRICE}&type=2&surface_from=&surface_till=&living_from=75&living_till=&order=newest#results`,
      selector: ".c-results",
    },
    {
      name: "Hintjens",
      url: "https://www.hintjens.eu/nl/te-huur/appartementen/1-kamers/min-1000-euro/max-1300-euro",
      selector: ".grid",
    },
    {
      name: "At home & Partners",
      url: `https://www.athomepartners.be/huren?type=appartement&minimum-prijs=${MIN_PRICE}&maximum-prijs=${MAX_PRICE}`,
      selector: "div.px-8:nth-child(3)",
      javascript: true,
    },
    {
      name: "Huyzen",
      selector: ".property-tiles-grid",
      url: `https://www.huyzen.be/te-huur/antwerpen-2000-regio/alle?category[]=flat&price[]=${MIN_PRICE}&price[]=${MAX_PRICE}&view=list`,
    },
    {
      name: "One Vastgoed",
      url: `https://onevastgoed.be/nl/te-huur?type=1&price-min=${MIN_PRICE}&price-max=${MAX_PRICE}`,
      selector: ".loader",
      javascript: true,
    },
    {
      name: "Clissen Immo",
      url: `https://www.clissenimmo.be/nl/te-huur?view=list&page=1&ptype=2&cities=ANTWERPEN&pricemin=${MIN_PRICE}&pricemax=${MAX_PRICE}`,
      selector: ".property-list",
    },
    {
      name: "Reant",
      url: `https://www.reant.be/nl/te-huur?view=list&page=1&pricemin=${MIN_PRICE}&pricemax=${MAX_PRICE}&ptype=2&cities=ANTWERPEN`,
      selector: "ul.productdetails:nth-child(4)",
    },
    {
      name: "Demeester",
      url: `https://www.demeester.eu/nl/huren?type%5B%5D=appartement&minPrice=${MIN_PRICE}&maxPrice=${MAX_PRICE}`,
      selector: "section.listing",
    },
    {
      name: "Sorenco",
      url: "https://www.sorenco.be/aanbod/te-huur/appartementen/kamers-1/max-1500-euro/",
      selector: "#properties",
    },
    {
      name: "De Waele",
      url: `https://www.dewaele.com/nl/te-huur/alle?filter%5Bcity_ids%5D%5B%5D=2834&filter%5Bstatuses%5D%5B%5D=Te+huur&filter%5Btypes%5D%5B%5D=Appartement&filter%5Bprice%5D%5Bmin%5D=&filter%5Bprice%5D%5Bmax%5D=${MAX_PRICE}&filter%5Bbedrooms%5D%5Bmin%5D=1&filter%5Bbedrooms%5D%5Bmax%5D=&filter%5Bsurface_built%5D%5Bmin%5D=&filter%5Bsurface_built%5D%5Bmax%5D=&filter%5Bsurface_plot%5D%5Bmin%5D=&filter%5Bsurface_plot%5D%5Bmax%5D=&filter%5Bsurface_livable%5D%5Bmin%5D=75&filter%5Bsurface_livable%5D%5Bmax%5D=&filter%5Bsurface_trading%5D%5Bmin%5D=&filter%5Bsurface_trading%5D%5Bmax%5D=&filter%5Bsurface_office%5D%5Bmin%5D=&filter%5Bsurface_office%5D%5Bmax%5D=&filter%5Bsurface_storage%5D%5Bmin%5D=&filter%5Bsurface_storage%5D%5Bmax%5D=&filter%5Bbathrooms%5D%5Bmin%5D=&filter%5Bbathrooms%5D%5Bmax%5D=&filter%5Bparking_spots%5D%5Bmin%5D=&filter%5Bparking_spots%5D%5Bmax%5D=&filter%5Bgarden%5D=&filter%5Bterrace%5D=&filter%5Bground_floor%5D=&filter%5Bfloor%5D%5Bmin%5D=&filter%5Bfloor%5D%5Bmax%5D=&filter%5Bsea_view%5D=&filter%5Bgarage%5D=&filter%5Bswimming_pool%5D=&filter%5Belevator%5D=&filter%5Bbike_storage%5D=&filter%5Bfurnished%5D=&filter%5Bsurface_terrace%5D%5Bmin%5D=&filter%5Bsurface_terrace%5D%5Bmax%5D=&filter%5Bloading_docks%5D%5Bmin%5D=&filter%5Bloading_docks%5D%5Bmax%5D=&filter%5Bfree_height%5D%5Bmin%5D=&filter%5Bfree_height%5D%5Bmax%5D=&filter%5Bkva%5D%5Bmin%5D=&filter%5Bkva%5D%5Bmax%5D=&filter%5Blight_street%5D=&filter%5Brolling_bridge%5D=&filter%5Brented%5D=`,
      selector: "#property-list",
    },
    {
      name: "Area",
      url: `https://www.area.be/nl/te-huur/?region=&type=2&budget=${MIN_PRICE}-${MAX_PRICE}`,
      selector: ".property-list-page",
      javascript: true,
    },
    {
      name: "Resa Vastgoed",
      url: `https://www.resa-vastgoed.be/nl/te-huur?view=list&page=1&pricemin=${MIN_PRICE}&pricemax=${MAX_PRICE}`,
      selector: ".custom-property-list",
    },
    {
      name: "Immovasta",
      url: `https://www.immovasta.be/panden/te-huur/?types=2&max_price=${MAX_PRICE}`,
      selector: ".apartment-list",
    },
    {
      name: "Reds",
      url: `https://www.reds.be/te-huur/antwerpen-2000-regio/appartement?price[]=${MIN_PRICE}&price[]=${MAX_PRICE}&view=list`,
      selector: ".grid--property-tiles",
    },
    {
      name: "Abricasa",
      url: `https://www.abricasa.be/nl/te-huur/?region=ANTWERPEN%7C2000-2018-2020-2060-2150%2CBERCHEM%7C2600&type=3&budget=${MIN_PRICE}-${MAX_PRICE}&order=`,
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
