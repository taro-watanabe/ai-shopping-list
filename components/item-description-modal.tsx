"use client";

import { useState, useEffect } from "react";

interface ItemDescriptionModalProps {
	open: boolean;
	onClose: () => void;
	itemName: string;
	selectedTagId: number | null;
	onConfirm: (name: string, tagId?: number, description?: string) => void;
}

async function fetchSingleTag(tagId: number) {
	const response = await fetch(`/api/tags?tagId=${tagId}`);
	if (!response.ok) {
		throw new Error("Failed to fetch tag");
	}
	const data = await response.json();
	return data.length > 0 ? data[0] : null;
}

export const ItemDescriptionModal: React.FC<ItemDescriptionModalProps> = ({
	open,
	onClose,
	itemName,
	selectedTagId,
	onConfirm,
}) => {
	const [loading, setLoading] = useState(false);
	const [descriptions, setDescriptions] = useState<string[]>([]);
	const [selectedDescription, setSelectedDescription] = useState<string | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [tagInfo, setTagInfo] = useState<{
		name: string;
		color: string;
	} | null>(null);

	useEffect(() => {
		// Reset states when modal opens or item name changes
		if (open && itemName) {
			setTagInfo(null);
			setSelectedDescription(null);
			fetchTagInfoAndDescriptions();
		}
	}, [open, itemName]);

	const fetchTagInfoAndDescriptions = async () => {
		setLoading(true);
		setError(null);

		try {
			// First fetch tag info if a tag is selected
			let tag = null;
			if (selectedTagId) {
				tag = await fetchSingleTag(selectedTagId);
				setTagInfo(tag);
			}

			// Then fetch descriptions with both item name and tag info
			await fetchDescriptions(tag);
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "An unknown error occurred",
			);
			setLoading(false);
		}
	};

	const fetchDescriptions = async (
		tag: { name: string; color: string } | null = null,
	) => {
		try {
			const response = await fetch("/api/itemdescription", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: itemName,
					tag: tag ? tag.name : null,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				const analysisText = data.analysis.replace(/^```json\n|```$/g, "");

				if (analysisText === "ERROR")
					throw new Error("Failed to get item descriptions");

				const analysis = JSON.parse(analysisText);

				// Handle different formats of descriptions
				let processedDescriptions: string[] = [];

				if (analysis.descriptions) {
					// Check if descriptions is an object with language keys
					if (
						typeof analysis.descriptions === "object" &&
						!Array.isArray(analysis.descriptions)
					) {
						// Extract descriptions from the first language (usually 'en')
						const firstLangKey = Object.keys(analysis.descriptions)[0];
						if (
							analysis.descriptions[firstLangKey] &&
							Array.isArray(analysis.descriptions[firstLangKey])
						) {
							processedDescriptions = analysis.descriptions[firstLangKey];
						} else {
							// If it's not an array, convert object values to an array of strings
							processedDescriptions = Object.values(analysis.descriptions)
								.filter((desc) => typeof desc === "string")
								.map((desc) => String(desc));
						}
					}
					// If it's already an array, use it directly
					else if (Array.isArray(analysis.descriptions)) {
						processedDescriptions = analysis.descriptions.map((desc) =>
							typeof desc === "string" ? desc : JSON.stringify(desc),
						);
					}
				}

				setDescriptions(processedDescriptions);

				// Auto-select the first description if available
				if (processedDescriptions.length > 0) {
					setSelectedDescription(processedDescriptions[0]);
				}
			} else {
				throw new Error("Failed to fetch descriptions");
			}
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "An unknown error occurred",
			);
		} finally {
			setLoading(false);
		}
	};

	// Parse description into tags/keywords
	const renderKeywordTags = (description: string) => {
		// First try to extract potential JSON content
		let processedDescription = description;

		try {
			// Try to parse as JSON in case it's a language object
			const parsed = JSON.parse(description);
			if (typeof parsed === "object" && !Array.isArray(parsed)) {
				// For language objects, join all values
				processedDescription = Object.values(parsed).join(", ");
			} else {
				// If it's another kind of JSON, stringify it
				processedDescription = JSON.stringify(parsed);
			}
		} catch (e) {
			// Not JSON, use as is
			processedDescription = description;
		}

		// Now split by commas and render as tags
		return processedDescription
			.split(",")
			.map((keyword) => keyword.trim())
			.filter((keyword) => keyword.length > 0)
			.map((keyword, index) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					key={index}
					className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
				>
					{keyword}
				</span>
			));
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
				<h2 className="text-xl font-bold mb-4">Item Descriptions</h2>

				{tagInfo && (
					<div className="mb-4 flex items-center gap-2">
						<span>Category:</span>
						<div className="flex items-center gap-1">
							<span
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: `#${tagInfo.color}` }}
							/>
							<span>{tagInfo.name}</span>
						</div>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center p-4">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
						<span className="ml-2">
							Fetching & Generating related keywords...
						</span>
					</div>
				) : error ? (
					<div className="text-red-500 mb-4">{error}</div>
				) : descriptions.length > 0 ? (
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">{itemName}</h2>
						<p className="text-md font-semibold mb-2">
							Please select a set of related keywords that fits the most to what
							you're imagining (there may be only one option)
						</p>
						<div className="space-y-4">
							{descriptions.map((desc, index) => (
								// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									key={index}
									onClick={() => setSelectedDescription(desc)}
									className={`p-4 border rounded cursor-pointer transition-all ${
										selectedDescription === desc
											? "bg-blue-100 border-blue-500 shadow-sm"
											: "bg-white hover:bg-gray-50"
									}`}
								>
									<div className="flex flex-wrap gap-2">
										{renderKeywordTags(desc)}
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<p className="text-gray-500 mb-4">No related keywords available.</p>
				)}

				<div className="mt-4 flex justify-end gap-2">
					<button
						type="button"
						className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type="button"
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
						onClick={() =>
							onConfirm(
								itemName,
								selectedTagId || undefined,
								selectedDescription || undefined,
							)
						}
					>
						Add Item
					</button>
				</div>
			</div>
		</div>
	);
};
