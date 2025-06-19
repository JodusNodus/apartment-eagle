import nodemailer from "nodemailer";
import showdown from "showdown";
import { config } from "../config/config.js";
import logger from "../utils/logger.js";
import { Listing } from "./scraper.js";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// Initialize Showdown converter
const converter = new showdown.Converter({
  tables: true,
  strikethrough: true,
  tasklists: true,
  simpleLineBreaks: true,
});

export async function sendNotification(
  listing: Listing,
  evaluation: string
): Promise<void> {
  logger.info(`Attempting to send email notification for ${listing.agency}`);
  logger.info(`Email will be sent to: ${config.email.to}`);

  // Convert markdown evaluation to HTML
  const evaluationHtml = converter.makeHtml(evaluation);

  const mailOptions = {
    from: config.email.user,
    to: config.email.to,
    subject: `New Apartment Found: ${listing.agency}`,
    text: `A new apartment listing was found on ${listing.agency}!\n\nURL: ${listing.url}\nTimestamp: ${listing.timestamp}\n\nAI Evaluation:\n${evaluation}`,
    html: `
      <h2>New Apartment Found!</h2>
      <p><strong>Agency:</strong> ${listing.agency}</p>
      <p><strong>URL:</strong> <a href="${listing.url}">${listing.url}</a></p>
      <p><strong>Timestamp:</strong> ${listing.timestamp}</p>
      <h3>AI Evaluation:</h3>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #007cba;">
        ${evaluationHtml}
      </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Notification sent successfully for ${listing.agency}`);
  } catch (error: any) {
    logger.error(`Error sending notification: ${error.message}`);
    logger.error(
      `Email configuration: host=${config.email.host}, port=${config.email.port}, user=${config.email.user}, to=${config.email.to}`
    );
  }
}

export async function sendBatchNotification(
  evaluations: Array<{ agency: string; evaluation: string; url: string }>
): Promise<void> {
  logger.info(
    `Attempting to send batch email notification for ${evaluations.length} agencies`
  );
  logger.info(`Email will be sent to: ${config.email.to}`);

  const timestamp = new Date().toISOString();

  // Convert all evaluations to HTML
  const evaluationHtmls = evaluations
    .map(({ agency, evaluation, url }) => {
      const evaluationHtml = converter.makeHtml(evaluation);
      return `
      <div style="margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
        <h3 style="margin-top: 0; color: #007cba;">${agency}</h3>
        <p><strong>Agency URL:</strong> <a href="${url}">${url}</a></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #007cba;">
          ${evaluationHtml}
        </div>
      </div>
    `;
    })
    .join("");

  const mailOptions = {
    from: config.email.user,
    to: config.email.to,
    subject: `New Apartments Found: ${evaluations.length} agencies have updates`,
    text: `New apartment listings were found on ${
      evaluations.length
    } agencies!\n\nTimestamp: ${timestamp}\n\nAI Evaluations:\n${evaluations
      .map((e) => `${e.agency}:\n${e.evaluation}\n`)
      .join("\n")}`,
    html: `
      <h2>New Apartments Found!</h2>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      <p><strong>Agencies with updates:</strong> ${evaluations.length}</p>
      <hr style="margin: 20px 0;">
      ${evaluationHtmls}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(
      `Batch notification sent successfully for ${evaluations.length} agencies`
    );
  } catch (error: any) {
    logger.error(`Error sending batch notification: ${error.message}`);
    logger.error(
      `Email configuration: host=${config.email.host}, port=${config.email.port}, user=${config.email.user}, to=${config.email.to}`
    );
  }
}
