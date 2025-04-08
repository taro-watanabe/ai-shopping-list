"use client";

import { useState, useRef, useEffect } from "react";

// Maximum width or height for the compressed image
const MAX_DIMENSION = 800;
const COMPRESSION_QUALITY = 0.2;

interface ReceiptUploadModalProps {
	open: boolean;
	onClose: () => void;
	onUpload: (imageData: string) => Promise<void>; // Changed to return Promise
}

export function ReceiptUploadModal({
	open,
	onClose,
	onUpload,
}: ReceiptUploadModalProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Reset state when modal closes
	useEffect(() => {
		if (!open) {
			setPreview(null);
			setUploading(false);
			setError(null);
			setFileName(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	}, [open]);

	// Compress image and return base64
	const compressImage = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					// Calculate new dimensions while maintaining aspect ratio
					let width = img.width;
					let height = img.height;

					if (width > height && width > MAX_DIMENSION) {
						height = Math.round((height * MAX_DIMENSION) / width);
						width = MAX_DIMENSION;
					} else if (height > MAX_DIMENSION) {
						width = Math.round((width * MAX_DIMENSION) / height);
						height = MAX_DIMENSION;
					}

					// Create canvas and draw resized image
					const canvas = document.createElement("canvas");
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						reject(new Error("Could not get canvas context"));
						return;
					}

					ctx.drawImage(img, 0, 0, width, height);

					// Get compressed base64 string
					const compressed = canvas.toDataURL(
						"image/jpeg",
						COMPRESSION_QUALITY,
					);
					resolve(compressed);
				};

				img.onerror = (error) => {
					reject(error);
				};

				img.src = e.target?.result as string;
			};

			reader.onerror = (error) => {
				reject(error);
			};

			reader.readAsDataURL(file);
		});
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setFileName(file.name);
			try {
				// Compress the image before setting preview
				const compressedImage = await compressImage(file);
				setPreview(compressedImage);
				setError(null);
			} catch (err) {
				console.error("Image compression failed:", err);
				setError("Failed to process image. Please try again.");
			}
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const handleUpload = async () => {
		if (preview) {
			setUploading(true);
			setError(null);
			try {
				// Extract base64 data without metadata
				const base64Data = preview.split(",")[1];
				await onUpload(base64Data); // Wait for upload to complete
				onClose(); // Only close after successful upload
			} catch (err) {
				console.error("Upload failed:", err);
				setError("Upload failed. Please try again.");
				setUploading(false);
			}
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<h2 className="text-xl font-bold mb-4">Upload Receipt</h2>

				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					className="hidden"
					disabled={uploading}
				/>

				{/* Custom styled button */}
				<div className="mb-4">
					<button
						type="button"
						onClick={triggerFileInput}
						className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 flex items-center"
						disabled={uploading}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
							/>
						</svg>
						Select Receipt Image
					</button>
					{fileName && (
						<p className="mt-2 text-sm text-gray-600">Selected: {fileName}</p>
					)}
				</div>

				{preview && (
					<div className="mb-4">
						<img
							src={preview}
							alt="Receipt preview"
							className="max-h-64 object-contain mx-auto"
						/>
					</div>
				)}

				{error && (
					<div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
						{error}
					</div>
				)}

				{uploading && (
					<div className="mb-4 flex items-center justify-center p-2">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
						<span>Uploading receipt... Please wait</span>
					</div>
				)}

				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-gray-600 hover:text-gray-800"
						disabled={uploading}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleUpload}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
						disabled={!preview || uploading}
					>
						{uploading ? "Uploading..." : "Upload"}
					</button>
				</div>
			</div>
		</div>
	);
}
