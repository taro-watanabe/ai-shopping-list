import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

function loadOpenAIApiKeyCoalescing(): string {
	const directApiKey = process.env.OPENAI_API_KEY?.trim();
	if (directApiKey) {
		console.info("Using OpenRouter API key from direct environment variable.");
		return directApiKey;
	}

	const apiKeyPath = process.env.OPENAI_API_KEY_PATH?.trim();
	if (!apiKeyPath) {
		throw new Error(
			"FATAL: Could not load OpenRouter API key. Set either OPENAI_API_KEY (direct value) or OPENAI_API_KEY_PATH (path to key file) environment variable."
		);
	}

	try {
		const absolutePath = path.resolve(apiKeyPath); // Ensure absolute path
		console.info(
			`Attempting to load OpenRouter API key from file: ${absolutePath}`
		);

		const keyContent = fs.readFileSync(absolutePath, "utf8").trim();

		if (!keyContent) {
			throw new Error(
				`API key file found at ${absolutePath} but it is empty.`
			);
		}

		console.info("Successfully loaded OpenRouter API key from file.");
		return keyContent;
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(
				`FATAL: Failed to read OpenRouter API key from file specified by OPENAI_API_KEY_PATH (${apiKeyPath}): ${error.message}`
			);
			throw new Error(
				`Could not load OpenRouter API key from file: ${error.message}`
			);
		}
		console.error(
			"FATAL: An unknown error occurred while reading the OpenRouter API key file."
		);
		throw new Error("Could not load OpenRouter API key from file.");
	}
}


const effectiveOpenAIApiKey = loadOpenAIApiKeyCoalescing();

export const openai = new OpenAI({
	apiKey: effectiveOpenAIApiKey,
	dangerouslyAllowBrowser: true,
});      
