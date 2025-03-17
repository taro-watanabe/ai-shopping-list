"use client";

import { useState, useEffect } from "react";

interface ReceiptViewModalProps {
    open: boolean;
    onClose: () => void;
    itemId: number | undefined | null;
    personName?: string;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
    open,
    onClose,
    itemId,
    personName,
}) => {
    const [receipt, setReceipt] = useState<{
        id: number;
        imageBase64: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        async function fetchReceipt() {
            if (!open || !itemId) return;

            setLoading(true);
            try {
                const response = await fetch(`/api/receipts?itemId=${itemId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setReceipt(data[0]); // We now expect at most one receipt
                    } else {
                        setReceipt(null);
                    }
                }
            } catch (error) {
                console.error("Error fetching receipt:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchReceipt();
        // Reset analysis when modal opens
        setAnalysis(null);
    }, [open, itemId]);

    const handleAnalyze = async () => {
        if (!receipt) return;

        setAnalyzing(true);
        try {
            const response = await fetch(`/api/receipts?receiptId=${receipt.id}&analyze=true`);
            if (response.ok) {
                const data = await response.json();
                setAnalysis(data.analysis);
            } else {
                setAnalysis("Failed to analyze receipt");
            }
        } catch (error) {
            console.error("Error analyzing receipt:", error);
            setAnalysis("Error analyzing receipt");
        } finally {
            setAnalyzing(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        {personName ? `Receipt from ${personName}` : "Receipt"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading receipt...</div>
                ) : !receipt ? (
                    <div className="text-center py-8">No receipt found</div>
                ) : (
                    <>
                        <div className="border rounded-lg overflow-hidden mb-4">
                            <img
                                src={`data:image/jpeg;base64,${receipt.imageBase64}`}
                                alt="Receipt"
                                className="w-full object-contain"
                            />
                        </div>

                        <div className="flex justify-center mb-4">
                            <button
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                {analyzing ? "Analyzing..." : "Analyze Receipt"}
                            </button>
                        </div>

                        {analysis && (
                            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
                                <h4 className="font-semibold mb-2">AI Analysis</h4>
                                <p className="text-gray-700">{analysis}</p>
                            </div>
                        )}
                    </>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
