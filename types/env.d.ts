declare global {
	namespace NodeJS {
		interface ProcessEnv {
			OPENROUTER_API_KEY: string;
		}
	}
}

// Need to be exported to be a valid module
export type {};
