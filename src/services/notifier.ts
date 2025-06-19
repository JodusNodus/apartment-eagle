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
  // Check if we have any recipients
  if (config.email.to.length === 0) {
    logger.warn("No email recipients configured, skipping notification");
    return;
  }

  const mailOptions = {
    from: config.email.user,
    to: config.email.to.join(", "), // Join multiple emails with commas
    subject: `New Apartments Found: ${evaluations.length} listings`,
    text: `New apartment listings found!`,
    html: `
      <h2>New Apartments Found!</h2>
      <ol>
        ${Array.from(evaluations)
          .map((e) => e.url)
          .map((url) => `<li><a href="${url}" target="_blank">${url}</a></li>`)
          .join("")}
      </ol>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(
      `Batch notification sent successfully with ${evaluations.length} URLs to ${config.email.to.length} recipients`
    );
  } catch (error: any) {
    logger.error(`Error sending batch notification: ${error.message}`);
    logger.error(
      `Email configuration: host=${config.email.host}, port=${
        config.email.port
      }, user=${config.email.user}, to=${config.email.to.join(", ")}`
    );
  }
}
