declare global {
	namespace NodeJS {
		interface ProcessEnv {
			OPENROUTER_API_KEY: string;
			OPENAI_API_KEY: string;
			OPENROUTER_API_KEY_PATH: string;
			OPENAI_API_KEY_PATH: string;
		}
	}
}

// Need to be exported to be a valid module
export type { };
