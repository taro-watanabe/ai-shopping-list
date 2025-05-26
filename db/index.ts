import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import fs from "node:fs";
import path from "node:path";

function loadTursoCredentials() {
	// Try direct env vars first
	const directUrl = process.env.TURSO_DATABASE_URL?.trim();
	const directToken = process.env.TURSO_AUTH_TOKEN?.trim();
	if (directUrl && directToken) {
		console.info("Using Turso credentials from direct environment variables.");
		return { url: directUrl, authToken: directToken };
	}

	// Fall back to file paths
	const urlPath = process.env.TURSO_DATABASE_URL_PATH?.trim();
	const tokenPath = process.env.TURSO_AUTH_TOKEN_PATH?.trim();
	if (!urlPath || !tokenPath) {
		throw new Error(
			"FATAL: Could not load Turso credentials. Set either:\n" +
				"1. TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (direct values), OR\n" +
				"2. TURSO_DATABASE_URL_PATH and TURSO_AUTH_TOKEN_PATH (paths to credential files)",
		);
	}

	try {
		const absoluteUrlPath = path.resolve(urlPath);
		const absoluteTokenPath = path.resolve(tokenPath);
		console.info(
			`Attempting to load Turso credentials from files:\n- URL: ${absoluteUrlPath}\n- Token: ${absoluteTokenPath}`,
		);

		const url = fs.readFileSync(absoluteUrlPath, "utf8").trim();
		const authToken = fs.readFileSync(absoluteTokenPath, "utf8").trim();

		if (!url || !authToken) {
			throw new Error(
				`Credential files found but one or both are empty.\n- URL file: ${urlPath}\n- Token file: ${tokenPath}`,
			);
		}

		console.info("Successfully loaded Turso credentials from files.");
		return { url, authToken };
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(
				`FATAL: Failed to read Turso credentials from files:\n- URL path: ${urlPath}\n- Token path: ${tokenPath}\nError: ${error.message}`,
			);
			throw new Error(`Could not load Turso credentials: ${error.message}`);
		}
		console.error(
			"FATAL: An unknown error occurred while reading Turso credential files.",
		);
		throw new Error("Could not load Turso credentials.");
	}
}

const { url, authToken } = loadTursoCredentials();

const client = createClient({
	url,
	authToken,
});

export const db = drizzle(client, { schema });
