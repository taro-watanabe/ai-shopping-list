import OpenAI from "openai";

// OpenRouter client with OpenAI-compatible interface
const openRouter = new OpenAI({
	apiKey: process.env.OPENROUTER_API_KEY,
	baseURL: "https://openrouter.ai/api/v1",
	defaultHeaders: {
		"HTTP-Referer": process.env.NEXT_PUBLIC_HOST || "http://localhost:3000", // Required by OpenRouter
		"X-Title": "Oh-Todo-Next App", // Optional, title of your application
	},
});

// Simple completion function example - can be expanded as needed
export async function getCompletion(prompt: string) {
	try {
		const response = await openRouter.completions.create({
			model: "google/gemma-3-4b-it:free", // Updated to Gemma 3
			prompt,
			max_tokens: 100,
		});

		return response.choices[0]?.text || "";
	} catch (error) {
		console.error("OpenRouter API error:", error);
		throw error;
	}
}

// Standard chat completion function
export async function getChatCompletion(
	messages: Array<{ role: string; content: string }>,
) {
	try {
		const response = await openRouter.chat.completions.create({
			model: "google/gemma-3-4b-it:free", // Updated to Gemma 3
			messages,
		});

		return response.choices[0]?.message?.content || "";
	} catch (error) {
		console.error("OpenRouter API error:", error);
		throw error;
	}
}

// New function for multimodal chat with image support
export async function getMultimodalCompletion(
	messages: Array<{
		role: string;
		content: Array<
			| { type: "text"; text: string }
			| { type: "image_url"; image_url: { url: string } }
		>;
	}>,
) {
	try {
		const response = await openRouter.chat.completions.create({
			model: "google/gemma-3-4b-it:free", // Gemma 3 supports multimodal
			messages,
		});

		return response.choices[0]?.message?.content || "";
	} catch (error) {
		console.error("OpenRouter Multimodal API error:", error);
		throw error;
	}
}

// Helper function to convert base64 image to OpenAI compatible format
export function createImageMessage(base64Image: string, prompt: string) {
	return {
		role: "user" as const,
		content: [
			{
				type: "text" as const,
				text: prompt,
			},
			{
				type: "image_url" as const,
				image_url: {
					url: `data:image/jpeg;base64,${base64Image}`,
				},
			},
		],
	};
}

export { openRouter };
