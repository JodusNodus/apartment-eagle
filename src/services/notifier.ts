import nodemailer from "nodemailer";
import { config } from "../config/config.js";
import logger from "../utils/logger.js";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export async function sendBatchNotification(
  evaluations: Array<{ agency: string; evaluation: string; url: string }>
): Promise<void> {
  logger.info(
    `Attempting to send batch email notification for ${evaluations.length} agencies`
  );
  logger.info(`Email will be sent to: ${config.email.to}`);

  const timestamp = new Date().toISOString();

  // Extract URLs from evaluations
  const urls = new Set<string>();
  evaluations.forEach(({ evaluation }) => {
    // First try to extract markdown format URLs: [text](url)
    const markdownMatches = evaluation.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (markdownMatches) {
      markdownMatches.forEach((match) => {
        const urlMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (urlMatch) {
          urls.add(urlMatch[2]); // Extract the actual URL
        }
      });
    }

    // If no markdown URLs found, extract plain URLs
    if (urls.size === 0) {
      const plainUrlMatches = evaluation.match(/https?:\/\/[^\s]+/g);
      if (plainUrlMatches) {
        plainUrlMatches.forEach((url) => urls.add(url));
      }
    }
  });

  if (urls.size === 0) {
    throw new Error("No URLs found in evaluations");
  }

  // Create simple URL list
  const urlList = Array.from(urls)
    .map((url, index) => `${index + 1}. ${url}`)
    .join("\n");

  const mailOptions = {
    from: config.email.user,
    to: config.email.to,
    subject: `New Apartments Found: ${urls.size} listings`,
    text: `New apartment listings found!\n\nTimestamp: ${timestamp}\n\nURLs to visit:\n${urlList}`,
    html: `
      <h2>New Apartments Found!</h2>
      <ol>
        ${Array.from(urls)
          .map((url) => `<li><a href="${url}" target="_blank">${url}</a></li>`)
          .join("")}
      </ol>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Batch notification sent successfully with ${urls.size} URLs`);
  } catch (error: any) {
    logger.error(`Error sending batch notification: ${error.message}`);
    logger.error(
      `Email configuration: host=${config.email.host}, port=${config.email.port}, user=${config.email.user}, to=${config.email.to}`
    );
  }
}
