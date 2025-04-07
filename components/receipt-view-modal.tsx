"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
						<span>Payer (optional):</span>
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
													{analysisItem.name} (${analysisItem.price})
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
																{match.dbItem.name} (${match.analysisItem.price}
																)
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

									const results = await Promise.all(
										validMatches.map(async (match) => {
											try {
												const dbItem = match.dbItem;
												if (!dbItem) return null; // Extra safeguard

												const requestBody = {
													id: dbItem.id,
													checked: true,
													// Only include personId if it's selected
													...(selectedPayer && { personId: selectedPayer }),
													receiptId: receipt?.id,
													price: match.analysisItem.price || dbItem.price,
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

												const result = await response.json();
												return result;
											} catch (error) {
												console.error("Error processing match:", match, error);
												throw error; // Re-throw to be caught by the outer catch
											}
										}),
									);
									onClose();
									setSelectedPayer("");

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
