import express, { Request, Response } from "express";
import { main } from "./index.js";
import { closeDatabase } from "./services/database.js";
import logger from "./utils/logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint for Railway
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "apartment-eagle",
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Apartment Eagle is running!",
    status: "active",
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/api/health`);
});

// Start the apartment watcher
logger.info("Starting Apartment Eagle...");
main().catch(async (error: any) => {
  logger.error("Failed to start apartment watcher:", error);
  await closeDatabase();
  process.exit(1);
});
