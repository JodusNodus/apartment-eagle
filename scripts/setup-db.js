#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log("🚀 Starting database setup...");

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    console.log("✅ DATABASE_URL is configured");

    // Generate Prisma client
    console.log("📦 Generating Prisma client...");
    execSync("npx prisma generate", {
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("✅ Prisma client generated");

    // Test database connection
    console.log("🔌 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Push schema to database
    console.log("🗄️ Pushing schema to database...");
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("✅ Database schema pushed successfully");

    // Verify table exists
    console.log("🔍 Verifying table creation...");
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'scraped_urls'
    `;

    if (tableCount[0].count > 0) {
      console.log("✅ scraped_urls table exists");
    } else {
      throw new Error("scraped_urls table was not created");
    }

    console.log("🎉 Database setup completed successfully!");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
