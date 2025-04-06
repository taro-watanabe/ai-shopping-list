"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ReceiptViewModalProps {
	open: boolean;
	onClose: () => void;
	itemId?: number | null;
	receiptId?: number | null;
}

export const ReceiptViewOnlyModal: React.FC<ReceiptViewModalProps> = ({
	open,
	onClose,
	itemId,
	receiptId,
}) => {
	const queryClient = useQueryClient();
	const [receipt, setReceipt] = useState<{
		id: number;
		imageBase64: string;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [analysis, setAnalysis] = useState<string | null>(null);
	const [people, setPeople] = useState<{ id: string; name: string }[]>([]);

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
		setAnalysis(null);
	}, [open, itemId, receiptId]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<h2 className="text-xl font-bold mb-4">Receipt</h2>

				{receipt?.imageBase64 && (
					<div className="mb-4">
						<img
							src={`data:image/jpeg;base64,${receipt.imageBase64}`}
							alt="Uploaded receipt"
							className="max-w-full h-auto rounded-lg shadow-sm"
						/>
					</div>
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
				</div>
			</div>
		</div>
	);
};
