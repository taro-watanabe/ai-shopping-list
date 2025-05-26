import type { Config } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";

function loadTursoCredentials() {
  const directUrl = process.env.TURSO_DATABASE_URL?.trim();
  const directToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (directUrl && directToken) {
    return { url: directUrl, authToken: directToken };
  }

  const urlPath = process.env.TURSO_DATABASE_URL_PATH?.trim();
  const tokenPath = process.env.TURSO_AUTH_TOKEN_PATH?.trim();
  if (!urlPath || !tokenPath) {
    throw new Error(
      "Could not load Turso credentials. Set either:\n" +
      "1. TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (direct values), OR\n" +
      "2. TURSO_DATABASE_URL_PATH and TURSO_AUTH_TOKEN_PATH (paths to credential files)"
    );
  }

  try {
    const url = fs.readFileSync(path.resolve(urlPath), "utf8").trim();
    const authToken = fs.readFileSync(path.resolve(tokenPath), "utf8").trim();
    return { url, authToken };
  } catch (error) {
    throw new Error(`Could not load Turso credentials: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const { url, authToken } = loadTursoCredentials();

export default {
	schema: "./db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		url,
		authToken,
	},
} as Config;
