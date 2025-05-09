"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ItemCard } from "@/components/item-card";

interface ArchivedItem {
	id: number;
	name: string;
	description: string | null;
	price: number | null;
	checkedAt: string;
	createdAt: string;
	tag: {
		id: number;
		name: string;
		color: string;
	} | null;
	person: {
		id: number;
		name: string;
		color: string;
	} | null;
}

interface ApiResponse {
	items: ArchivedItem[];
	currentPage: number;
	totalPages: number;
	totalItems: number;
}

export default function ArchivedItemsPage() {
	const searchParams = useSearchParams();
	const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
	const currency = process.env.NEXT_PUBLIC_CURRENCY || "€";

	const { data, isLoading, isError } = useQuery<ApiResponse>({
		queryKey: ["archived-items", page],
		queryFn: async () => {
			const res = await fetch(`/api/archived-items?page=${page}`);
			if (!res.ok) {
				throw new Error("Failed to fetch archived items");
			}
			return res.json();
		},
	});

	const handlePrevPage = () => {
		if (page > 1) setPage(page - 1);
	};

	const handleNextPage = () => {
		if (data && page < data.totalPages) setPage(page + 1);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen pt-16 px-4">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-2xl font-bold mb-6">Loading archived items...</h1>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="min-h-screen pt-16 px-4">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-2xl font-bold mb-6">
						Error loading archived items
					</h1>
					<p className="text-red-500">
						Failed to load archived items. Please try again.
					</p>
				</div>
			</div>
		);
	}

	return (
		<main className="min-h-screen pt-16 px-4 max-w-4xl mx-auto">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Archived Items</h1>
				<Link href="/" className="text-blue-500 hover:underline">
					Back to Shopping List
				</Link>
			</div>

			{data?.items.length === 0 ? (
				<p className="text-gray-500">No archived items found.</p>
			) : (
				<div className="space-y-4">
					{data?.items.map((item) => (
						<ItemCard
							key={item.id}
							item={item}
							showCheckbox={false}
							currency={currency}
							showDatePrefix="Archived on: "
						/>
					))}

					<div className="flex justify-between items-center mt-6">
						<button
							type="button"
							onClick={handlePrevPage}
							disabled={page === 1}
							className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
						>
							Previous
						</button>
						<span>
							Page {data?.currentPage} of {data?.totalPages}
						</span>
						<button
							type="button"
							onClick={handleNextPage}
							disabled={!data || page >= data.totalPages}
							className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
						>
							Next
						</button>
					</div>
				</div>
			)}
		</main>
	);
}
