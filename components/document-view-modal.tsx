"use client";

import { useState } from "react";

interface DocumentViewModalProps {
    open: boolean;
    onClose: () => void;
    imageBase64?: string;
}

export const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
    open,
    onClose,
    imageBase64,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Document View</h2>

                {imageBase64 && (
                    <div className="mb-4">
                        <img
                            src={`data:image/jpeg;base64,${imageBase64}`}
                            alt="Document preview"
                            className="max-w-full h-auto rounded-lg shadow-sm"
                        />
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
