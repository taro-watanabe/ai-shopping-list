"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const currency = process.env.CURRENCY || "€";

interface AnalysisItem {
	name: string;
	price: number;
	description: string;
	embedding: number[];
}

interface DbItem {
	id: number;
	name: string;
	price: number;
	checked: boolean;
	vector: string;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
	if (vecA.length === 0 || vecB.length === 0) return 0;
	if (vecA.length !== vecB.length) return 0;

	const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
	const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
	const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

	return dotProduct / (magnitudeA * magnitudeB);
}

interface ReceiptViewModalProps {
	open: boolean;
	onClose: () => void;
	itemId?: number | null;
	receiptId?: number | null;
	personName?: string;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
	open,
	onClose,
	itemId,
	receiptId,
	personName,
}) => {
	const queryClient = useQueryClient();
	const [receipt, setReceipt] = useState<{
		id: number;
		imageBase64: string;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [analysis, setAnalysis] = useState<string | null>(null);
	const [parsedAnalysis, setParsedAnalysis] = useState<{
		items: AnalysisItem[];
		embeddings: number[][];
	} | null>(null);
	const [matches, setMatches] = useState<
		Array<{
			analysisItem: AnalysisItem;
			dbItem: DbItem | null;
		}>
	>([]);
	const [dbItems, setDbItems] = useState<DbItem[]>([]);
	const [selectedPayer, setSelectedPayer] = useState<string>("");
	const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
	const [analyzing, setAnalyzing] = useState(false);
	const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
	const [selectedTag, setSelectedTag] = useState<string>("");
	const [newlyCreatedItems, setNewlyCreatedItems] = useState<DbItem[]>([]);
	const [bulkCreating, setBulkCreating] = useState(false);
	const [bulkDeleting, setBulkDeleting] = useState(false);

	useEffect(() => {
		async function fetchPeople() {
			try {
				const response = await fetch("/api/people");
				const data = await response.json();
				setPeople(data);
			} catch (error) {
				console.error("Error fetching people:", error);
			}
		}

		fetchPeople();
	}, []);

	useEffect(() => {
		async function fetchTags() {
			try {
				const response = await fetch("/api/tags");
				const data = await response.json();
				setTags(data);
			} catch (error) {
				console.error("Error fetching tags:", error);
			}
		}

		fetchTags();
	}, []);

	useEffect(() => {
		async function fetchReceipt() {
			if (!open || (!itemId && !receiptId)) return;
			setAnalysis(null);
			setParsedAnalysis(null);
			setMatches([]);
			setDbItems([]);
			setLoading(true);
			try {
				const queryParam = itemId
					? `itemId=${itemId}`
					: `receiptId=${receiptId}`;
				const response = await fetch(`/api/receipts?${queryParam}`);

				if (response.ok) {
					const data = await response.json();
					setReceipt(data.length > 0 ? data[0] : null);
				}
			} catch (error) {
				console.error("Error fetching receipt:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchReceipt();
	}, [open, itemId, receiptId]);

	const handleAnalyze = async (imageBase64: string) => {
		setAnalyzing(true);
		try {
			const response = await fetch("/api/openrouter", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ image: imageBase64 }),
			});

			if (response.ok) {
				const data = await response.json();
				const analysisText = data.analysis.replace(/^```json\n|```$/g, "");

				if (analysisText === "ERROR")
					throw new Error("Failed to analyze receipt");
				const analysis = JSON.parse(analysisText);
				const analysisItemsWithEmbeddings = (
					await Promise.all(
						analysis.items.map(async (item: AnalysisItem) => {
							try {
								const response = await fetch("/api/openai", {
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({ text: item.name + item.description }),
								});

								if (!response.ok) {
									throw new Error("Failed to generate embedding");
								}
								const embeddingData = await response.json();
								const embedding = embeddingData.embedding;
								if (!Array.isArray(embedding)) {
									throw new Error("Invalid embedding format");
								}
								if (embedding.length === 0) {
									throw new Error("Empty embedding");
								}
								if (!embedding.every((val) => typeof val === "number")) {
									throw new Error("Embedding contains non-numeric values");
								}
								if (embedding.length !== 1536) {
									throw new Error(
										`Embedding length is ${embedding.length}, expected 1536`,
									);
								}
								return { ...item, embedding };
							} catch (error) {
								console.error(
									"Error generating embedding for item:",
									item.name,
									error,
								);
								return null;
							}
						}),
					)
				).filter((item): item is AnalysisItem => item !== null);

				const itemsResponse = await fetch("/api/items?checked=false");
				const dbItems: DbItem[] = await itemsResponse.json();
				const foundMatches = [];
				for (const analysisItem of analysisItemsWithEmbeddings) {
					let matchFound = false;
					for (const dbItem of dbItems) {
						const parsedVector = JSON.parse(dbItem?.vector || "[]");
						const similarity = cosineSimilarity(
							analysisItem.embedding,
							parsedVector,
						);

						if (similarity > 0.5) {
							foundMatches.push({ analysisItem, dbItem });
							matchFound = true;
							break;
						}
					}

					if (!matchFound) {
						foundMatches.push({ analysisItem, dbItem: null });
					}
				}

				setParsedAnalysis({
					items: analysisItemsWithEmbeddings,
					embeddings: analysisItemsWithEmbeddings.map((item) => item.embedding),
				});

				setMatches(foundMatches);
				setDbItems(dbItems);
			}
		} catch (error) {
			console.error("Error analyzing receipt:", error);
			setAnalysis("Error analyzing receipt");
		} finally {
			setAnalyzing(false);
		}
	};

	const handleBulkAddNew = async () => {
		setBulkCreating(true);
		try {
			const ignoredItems = matches.filter(
				(item) => item.dbItem === null && item.analysisItem.price > 0,
			);
			if (ignoredItems.length === 0) {
				return;
			}

			const createdItems: DbItem[] = [];

			for (const match of ignoredItems) {
				try {
					const response = await fetch("/api/items", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							name: match.analysisItem.name,
							checked: false,
						}),
					});
					const newItem = await response.json();
					createdItems.push(newItem);

					setMatches((prev) =>
						prev.map((m) =>
							m.analysisItem === match.analysisItem
								? { analysisItem: match.analysisItem, dbItem: newItem }
								: m,
						),
					);
				} catch (error) {
					console.error("Error creating item:", error);
				}
			}

			setDbItems((prev) => [...prev, ...createdItems]);
			setNewlyCreatedItems((prev) => [...prev, ...createdItems]);
		} catch (error) {
			console.error("Error in bulk add:", error);
		} finally {
			setBulkCreating(false);
		}
	};

	const handleUndoBulkAdd = async () => {
		if (newlyCreatedItems.length === 0) return;

		setBulkDeleting(true);
		try {
			for (const item of newlyCreatedItems) {
				const id = item.id;
				try {
					await fetch("/api/items", {
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ id }),
					});

					setMatches((prev) =>
						prev.map((m) =>
							m.dbItem && m.dbItem.id === item.id
								? { analysisItem: m.analysisItem, dbItem: null }
								: m,
						),
					);
				} catch (error) {
					console.error("Error deleting item:", error);
				}
			}

			setDbItems((prev) =>
				prev.filter(
					(item) =>
						!newlyCreatedItems.some((newItem) => newItem.id === item.id),
				),
			);
			setNewlyCreatedItems([]);
		} catch (error) {
			console.error("Error in bulk delete:", error);
		} finally {
			setBulkDeleting(false);
		}
	};

	const selectedItemsCount = matches.filter(
		(match) => match.dbItem !== null,
	).length;

	// Determine button state - only disable if no items are selected
	const noItemsSelected = !matches.some((m) => m.dbItem !== null);
	const canSubmit = !noItemsSelected;

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<h2 className="text-xl font-bold mb-4">Receipt Analysis</h2>
				{receipt?.imageBase64 && (
					<div className="mb-4">
						<img
							src={`data:image/jpeg;base64,${receipt.imageBase64}`}
							alt="Uploaded receipt"
							className="max-w-full h-auto rounded-lg shadow-sm"
						/>
					</div>
				)}

				<div className="mb-4">
					<label className="flex items-center mb-2">
						<span>Who Paid? (optional):</span>
					</label>
					<select
						className="w-full p-2 border rounded"
						value={selectedPayer}
						onChange={(e) => setSelectedPayer(e.target.value)}
					>
						<option value="">No payer selected</option>
						{people.map((person) => (
							<option key={person.id} value={person.id}>
								{person.name}
							</option>
						))}
					</select>
				</div>

				<div className="mb-4">
					<label className="flex items-center mb-2">
						<span>Overwrite tag of checked items with (optional):</span>
					</label>
					<select
						className="w-full p-2 border rounded"
						value={selectedTag}
						onChange={(e) => setSelectedTag(e.target.value)}
					>
						<option value="">No tag selected</option>
						{tags.map((tag) => (
							<option key={tag.id} value={tag.id}>
								{tag.name}
							</option>
						))}
					</select>
				</div>

				{analyzing ? (
					<div className="flex items-center justify-center p-4">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
						<span className="ml-2">Analyzing receipt...</span>
					</div>
				) : parsedAnalysis?.items ? (
					<>
						<div className="mb-2 text-sm text-gray-600">
							<p>
								Select actions for each item: items with "Ignore" will be
								skipped, all others will be processed.
							</p>
							<p>
								{selectedItemsCount} item(s) selected for processing
								{selectedItemsCount > 0 && !selectedPayer && (
									<span className="text-gray-500 ml-1">
										(no payer selected)
									</span>
								)}
							</p>
							<div className="flex gap-2 my-2">
								<button
									className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
									type="button"
									onClick={handleBulkAddNew}
									disabled={
										bulkCreating ||
										!matches.some(
											(m) => m.dbItem === null && m.analysisItem.price > 0,
										)
									}
								>
									{bulkCreating ? (
										<>
											<span className="inline-block animate-spin mr-1">↻</span>
											Adding...
										</>
									) : (
										"Bulk add all items (apart from discounts)"
									)}
								</button>
								<button
									className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
									onClick={handleUndoBulkAdd}
									type="button"
									disabled={bulkDeleting || newlyCreatedItems.length === 0}
								>
									{bulkDeleting ? (
										<>
											<span className="inline-block animate-spin mr-1">↻</span>
											Undoing...
										</>
									) : (
										`Undo Added Items (${newlyCreatedItems.length})`
									)}
								</button>
							</div>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="bg-gray-100">
										<th className="p-2 border text-left">Receipt Item</th>
										<th className="p-2 border text-left">Action</th>
									</tr>
								</thead>
								<tbody>
									{parsedAnalysis.items.map((analysisItem, index) => {
										const match = matches.find(
											(m) => m.analysisItem === analysisItem,
										);
										const isSelected = match?.dbItem !== null;

										return (
											<tr
												key={analysisItem.name}
												className={`border ${isSelected ? "bg-blue-50" : ""}`}
											>
												<td className="p-2 border">
													{analysisItem.name} ({currency}
													{analysisItem.price})
												</td>
												<td className="p-2 border">
													<select
														className={`w-full p-1 border rounded ${
															isSelected
																? "bg-blue-50 border-blue-300"
																: "text-gray-500"
														}`}
														value={match?.dbItem?.id || "ignore"}
														onChange={async (e) => {
															const value = e.target.value;
															if (value === "ignore") {
																// Set to ignore
																setMatches((prev) =>
																	prev.map((m) =>
																		m.analysisItem === analysisItem
																			? { analysisItem, dbItem: null }
																			: m,
																	),
																);
															} else if (value === "new") {
																// Create new item
																try {
																	const response = await fetch("/api/items", {
																		method: "POST",
																		headers: {
																			"Content-Type": "application/json",
																		},
																		body: JSON.stringify({
																			name: analysisItem.name,
																			checked: false,
																		}),
																	});
																	const newItem = await response.json();
																	setDbItems((prev) => [...prev, newItem]);
																	setMatches((prev) =>
																		prev.map((m) =>
																			m.analysisItem === analysisItem
																				? { analysisItem, dbItem: newItem }
																				: m,
																		),
																	);
																} catch (error) {
																	console.error("Error creating item:", error);
																}
															} else {
																// Update existing match
																const dbItem = dbItems.find(
																	(item) => item.id === Number.parseInt(value),
																);
																if (dbItem) {
																	setMatches((prev) =>
																		prev.map((m) =>
																			m.analysisItem === analysisItem
																				? { analysisItem, dbItem }
																				: m,
																		),
																	);
																}
															}
														}}
													>
														<option value="ignore">Ignore this item</option>
														{match?.dbItem && (
															<option value={match.dbItem.id}>
																{match.dbItem.name} ({currency}
																{match.analysisItem.price})
															</option>
														)}
														<option value="new">
															+ Add new item based on receipt
														</option>
														{dbItems
															.filter(
																(item) =>
																	!match?.dbItem || item.id !== match.dbItem.id,
															)
															.map((item) => (
																<option key={item.id} value={item.id}>
																	{item.name}
																</option>
															))}
													</select>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</>
				) : (
					<p className="text-gray-500">No items analyzed yet</p>
				)}

				<div className="mt-4 flex justify-end gap-2">
					<button
						type="button"
						className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
						onClick={() => {
							queryClient.invalidateQueries({
								queryKey: ["items"],
								exact: false,
							});
							onClose();
							// Force refresh by combining immediate invalidation with delayed refetch
							setTimeout(() => {
								queryClient.refetchQueries({
									queryKey: ["items"],
									type: "active",
									stale: false,
								});
							}, 100);
						}}
					>
						Close
					</button>
					<button
						type="button"
						className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
						onClick={() =>
							receipt?.imageBase64 && handleAnalyze(receipt.imageBase64)
						}
						disabled={analyzing || !receipt?.imageBase64}
					>
						{analyzing ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
								Analyzing...
							</>
						) : (
							"Analyze Receipt"
						)}
					</button>
					<div className="relative">
						<button
							type="button"
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
							onClick={async () => {
								try {
									const validMatches = matches.filter(
										(match) => match.dbItem !== null,
									);
									if (validMatches.length === 0) {
										console.warn("No valid matches to process");
										return;
									}

									// Group matches by dbItem.id and calculate sum of prices
									const groupedMatches = validMatches.reduce(
										(acc, match) => {
											if (!match.dbItem) return acc;

											const dbItemId = match.dbItem.id;
											if (!acc[dbItemId]) {
												acc[dbItemId] = {
													dbItem: match.dbItem,
													totalPrice: 0,
													matchCount: 0,
												};
											}

											// Add this match's price to the total
											acc[dbItemId].totalPrice +=
												match.analysisItem.price || match.dbItem.price;
											acc[dbItemId].matchCount += 1;

											return acc;
										},
										{} as Record<
											number,
											{ dbItem: DbItem; totalPrice: number; matchCount: number }
										>,
									);

									// Process each grouped item with a single PUT request
									const results = await Promise.all(
										Object.values(groupedMatches).map(
											async ({ dbItem, totalPrice, matchCount }) => {
												try {
													console.log(
														`Processing ${matchCount} matches for ${dbItem.name} with total price $${totalPrice}`,
													);

													const requestBody = {
														id: dbItem.id,
														checked: true,
														...(selectedPayer && { personId: selectedPayer }),
														...(selectedTag && { tagId: selectedTag }),
														receiptId: receipt?.id,
														price: totalPrice, // Use the summed price
														checked_at: new Date().toISOString(),
													};

													const response = await fetch("/api/items", {
														method: "PUT",
														headers: { "Content-Type": "application/json" },
														body: JSON.stringify(requestBody),
													});

													if (!response.ok) {
														const errorText = await response.text();
														console.error(
															`API error (${response.status}):`,
															errorText,
														);
														throw new Error(
															`API returned ${response.status}: ${errorText}`,
														);
													}

													return await response.json();
												} catch (error) {
													console.error(
														"Error processing grouped item:",
														dbItem,
														error,
													);
													throw error;
												}
											},
										),
									);
									onClose();
									setSelectedPayer("");
									setSelectedTag("");

									// Invalidate items queries after updates
									queryClient.invalidateQueries({
										queryKey: ["items"],
										exact: false,
									});
									setTimeout(() => {
										queryClient.refetchQueries({
											queryKey: ["items"],
											type: "active",
											stale: false,
										});
									}, 100);
								} catch (error) {
									console.error("Error updating items:", error);
									alert("Failed to update items. Check console for details.");
								}
							}}
							disabled={!canSubmit}
							title={
								noItemsSelected
									? "No items selected for checking"
									: "Check selected items"
							}
						>
							Check {selectedItemsCount} Selected Item
							{selectedItemsCount !== 1 ? "s" : ""}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
