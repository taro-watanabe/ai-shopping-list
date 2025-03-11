"use client";

import { useState } from "react";

function Modal({
	open,
	onClose,
	children,
}: { open: boolean; onClose: () => void; children: React.ReactNode }) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">{children}</div>
		</div>
	);
}

interface Person {
	id: number;
	name: string;
	color: string;
}

interface PersonSelectModalProps {
	open: boolean;
	onClose: () => void;
	onSelect: (personId: number | null, price: number | null) => void;
	people: Person[];
}

export const PersonSelectModal: React.FC<PersonSelectModalProps> = ({
	open,
	onClose,
	onSelect,
	people,
}) => {
	const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
	const [price, setPrice] = useState<string>("");

	if (!open) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const priceValue = price ? Number.parseFloat(price) : null;
		onSelect(selectedPerson, priceValue);
		onClose();
		setSelectedPerson(null);
		setPrice("");
	};

	const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setSelectedPerson(value ? Number(value) : null);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<h3 className="text-lg font-semibold mb-4">
					Mark Item as Bought/Completed
				</h3>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<select
							id="person-select"
							value={selectedPerson ?? ""}
							onChange={handlePersonChange}
							className="w-full p-2 border rounded"
						>
							<option value="">Who Paid? (Optional)</option>
							{people.map((person) => (
								<option key={person.id} value={person.id}>
									{person.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<input
							type="number"
							id="price"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							placeholder="Enter price in EUR (Optional)"
							step="0.01"
							className="w-full p-2 border rounded"
						/>
					</div>

					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 border rounded hover:bg-gray-100"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Confirm
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
