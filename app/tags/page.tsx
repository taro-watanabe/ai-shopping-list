"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

async function fetchTags() {
	const response = await fetch("/api/tags");
	return response.json();
}

async function addTag({ name, color }: { name: string; color: string }) {
	const response = await fetch("/api/tags", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, color }),
	});
	return response.json();
}

async function deleteTag(id: number) {
	const response = await fetch("/api/tags", {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id }),
	});
	return response.json();
}

export default function TagsPage() {
	const queryClient = useQueryClient();
	const [newTagName, setNewTagName] = useState("");
	const [newTagColor, setNewTagColor] = useState("ffffff");

	const { data: tags = [], isLoading } = useQuery({
		queryKey: ["tags"],
		queryFn: fetchTags,
	});

	const addMutation = useMutation({
		mutationFn: addTag,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags"] });
			setNewTagName("");
			setNewTagColor("ffffff");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteTag,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tags"] });
		},
	});

	return (
		<main className="min-h-screen pt-16 px-4 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Tags</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (newTagName.trim() && newTagColor) {
						addMutation.mutate({ name: newTagName, color: newTagColor });
					}
				}}
				className="mb-4"
			>
				<div className="space-y-2">
					<input
						type="text"
						value={newTagName}
						onChange={(e) => setNewTagName(e.target.value)}
						placeholder="Tag name"
						className="w-full p-2 border rounded"
						required
					/>
					<div className="flex gap-2">
						<input
							type="color"
							value={`#${newTagColor}`}
							onChange={(e) => setNewTagColor(e.target.value.slice(1))}
							className="h-10 w-16 p-1 border rounded"
						/>
						<input
							type="text"
							value={newTagColor}
							onChange={(e) => setNewTagColor(e.target.value)}
							placeholder="Hex color"
							pattern="[a-fA-F0-9]{6}"
							className="w-full p-2 border rounded"
						/>
					</div>
					<button
						type="submit"
						className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
					>
						Add Tag
					</button>
				</div>
			</form>

			<ul className="space-y-2">
				{tags.map((tag: { id: number; name: string; color: string }) => (
					<li
						key={tag.id}
						className="flex items-center justify-between p-2 border rounded"
					>
						<div className="flex items-center gap-2">
							<span
								className="w-4 h-4 rounded-full"
								style={{ backgroundColor: `#${tag.color}` }}
							/>
							<span>{tag.name}</span>
						</div>
						<button
							type="button"
							onClick={() => deleteMutation.mutate(tag.id)}
							className="text-red-500 hover:text-red-700"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<title>Delete tag</title>
								<path
									fillRule="evenodd"
									d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</li>
				))}
			</ul>
		</main>
	);
}
