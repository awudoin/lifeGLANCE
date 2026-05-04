import { defineConfig } from "drizzle-kit";

const databaseUrl: string = process.env.DATABASE_URL ?? "./data/app.db";

export default defineConfig({
    dialect: "sqlite",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: databaseUrl,
    },
    verbose: true,
    strict: true,
});
