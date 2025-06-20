#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log("Setting up database...");

    // Generate Prisma client
    console.log("Generating Prisma client...");
    const { execSync } = await import("child_process");
    execSync("npx prisma generate", { stdio: "inherit" });

    // Push schema to database
    console.log("Pushing schema to database...");
    execSync("npx prisma db push", { stdio: "inherit" });

    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
