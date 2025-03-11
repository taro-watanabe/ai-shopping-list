"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PersonSelectModal } from "@/components/person-select-modal";

async function fetchItems() {
	const response = await fetch("/api/items?include=person");
	return response.json();
}

async function fetchTags() {
	const response = await fetch("/api/tags");
	return response.json();
}

async function fetchPeople() {
	const response = await fetch("/api/people");
	return response.json();
}

async function addItem({ name, tagId }: { name: string; tagId?: number }) {
	const response = await fetch("/api/items", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name, tagId }),
	});
	return response.json();
}

async function toggleItem({
	id,
	checked,
	personId,
	price,
}: { id: number; checked: boolean; personId?: number; price?: number }) {
	const response = await fetch("/api/items", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id, checked, personId, price }),
	});
	return response.json();
}

async function deleteItem(id: number) {
	const response = await fetch("/api/items", {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id }),
	});
	return response.json();
}

export default function Home() {
	const queryClient = useQueryClient();
	const [newItem, setNewItem] = useState("");
	const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [itemToCheck, setItemToCheck] = useState<number | null>(null);

	const { data: items = [], isLoading: itemsLoading } = useQuery({
		queryKey: ["items"],
		queryFn: fetchItems,
	});

	const { data: tags = [], isLoading: tagsLoading } = useQuery({
		queryKey: ["tags"],
		queryFn: fetchTags,
	});

	const { data: people = [], isLoading: peopleLoading } = useQuery({
		queryKey: ["people"],
		queryFn: fetchPeople,
	});

	const addMutation = useMutation({
		mutationFn: addItem,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
			setNewItem("");
			setSelectedTagId(null);
		},
	});

	const toggleMutation = useMutation({
		mutationFn: toggleItem,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
			setItemToCheck(null);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteItem,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
		},
	});

	const handleCheckItem = (id: number) => {
		setItemToCheck(id);
		setModalOpen(true);
	};

	const handlePersonSelect = (
		personId: number | null,
		price: number | null,
	) => {
		if (itemToCheck) {
			toggleMutation.mutate({
				id: itemToCheck,
				checked: true,
				personId: personId ?? undefined,
				price: price ?? undefined,
			});
		}
	};

	const renderItem = (item: {
		id: number;
		checked: boolean;
		name: string;
		createdAt: string;
		tagId?: number;
		tag?: { id: number; name: string; color: string };
		personId?: number;
		person?: { id: number; name: string; color: string };
		price?: number;
	}) => (
		<li key={item.id} className="flex items-center justify-between">
			<div className="flex items-center">
				<input
					type="checkbox"
					checked={item.checked}
					onChange={() => {
						if (!item.checked) {
							handleCheckItem(item.id);
						} else {
							toggleMutation.mutate({
								id: item.id,
								checked: false,
								personId: undefined,
								price: undefined,
							});
						}
					}}
					className="mr-2"
				/>
				<div className="flex flex-col">
					<span className={item.checked ? "line-through" : ""}>
						{item.name}
					</span>
					{item.price && (
						<span className="text-sm text-gray-600">
							€{item.price.toFixed(2)}
						</span>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				{item.tag && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-600">{item.tag.name}</span>
						<span
							className="w-4 h-4 rounded-full"
							style={{ backgroundColor: `#${item.tag.color}` }}
						/>
					</div>
				)}
				{item.person && (
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-600">{item.person.name}</span>
						<span
							className="w-4 h-4 rounded-full"
							style={{ backgroundColor: `#${item.person.color}` }}
						/>
					</div>
				)}
				<button
					type="button"
					onClick={() => deleteMutation.mutate(item.id)}
					className="text-red-500 hover:text-red-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<title>Delete item</title>
						<path
							fillRule="evenodd"
							d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</li>
	);

	return (
		<main className="p-4 max-w-md mx-auto">
			<h1 className="text-2xl font-bold mb-4">Shopping List</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (newItem.trim()) {
						addMutation.mutate({
							name: newItem,
							tagId: selectedTagId || undefined,
						});
					}
				}}
				className="mb-4 space-y-2"
			>
				<input
					type="text"
					value={newItem}
					onChange={(e) => setNewItem(e.target.value)}
					placeholder="Add new item"
					className="w-full p-2 border rounded"
				/>
				<select
					value={selectedTagId || ""}
					onChange={(e) => setSelectedTagId(Number(e.target.value) || null)}
					className="w-full p-2 border rounded"
				>
					<option value="">Select a tag (optional)</option>
					{tags.map((tag: { id: number; name: string }) => (
						<option key={tag.id} value={tag.id}>
							{tag.name}
						</option>
					))}
				</select>
				<button
					type="submit"
					className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
				>
					Add Item
				</button>
			</form>

			<ul className="space-y-2">
				{items
					.filter((item: { checked: boolean }) => !item.checked)
					.map(renderItem)}
			</ul>

			<div className="mt-8 pt-4 border-t">
				<h2 className="text-lg font-semibold mb-2">Checked Items</h2>
				<ul className="space-y-2">
					{items
						.filter((item: { checked: boolean }) => item.checked)
						.map(renderItem)}
				</ul>
			</div>

			<PersonSelectModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onSelect={handlePersonSelect}
				people={people}
			/>
		</main>
	);
}
